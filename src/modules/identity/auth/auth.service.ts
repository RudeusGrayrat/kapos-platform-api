import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { UserStatus } from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConsumerLoginDto } from './dto/consumer-login.dto';
import { ConsumerRegisterDto } from './dto/consumer-register.dto';
import { ErpLoginDto } from './dto/erp-login.dto';
import { LegacyLoginDto } from './dto/legacy-login.dto';

type RefreshTokenPayload = {
  sub: string;
  email: string | null;
  sessionId: string;
  exp?: number;
};

type JwtDuration = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

type SafeUser = {
  id: string;
  email: string | null;
  documentType: string | null;
  documentNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  documentVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type LocalLoginInput = {
  identifier: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerConsumer(registerDto: ConsumerRegisterDto): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.usersService.findByEmailForAuth(email);

    if (existingUser) {
      throw new ConflictException('A user with that email already exists.');
    }

    const passwordHash = await hash(registerDto.password, 12);

    try {
      const user = await this.usersService.createUser({
        email,
        passwordHash,
        firstName: registerDto.firstName?.trim() || null,
        lastName: registerDto.lastName?.trim() || null,
        status: UserStatus.ACTIVE,
      });

      const session = await this.issueSessionTokens(
        user.id,
        user.email ?? null,
      );

      return {
        user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with that email already exists.');
      }

      throw error;
    }
  }

  async loginLegacy(loginDto: LegacyLoginDto): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const identifier = loginDto.identifier ?? loginDto.email;

    if (!identifier) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.loginLocal({
      identifier,
      password: loginDto.password,
    });
  }

  async loginLocal(
    loginDto: ConsumerLoginDto | ErpLoginDto | LocalLoginInput,
  ): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.usersService.findByIdentifierForAuth(
      loginDto.identifier,
    );

    if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const lastLoginAt = new Date();
    const authenticatedUser = await this.usersService.markLoginSucceeded(
      user.id,
      lastLoginAt,
    );
    const session = await this.issueSessionTokens(
      authenticatedUser.id,
      authenticatedUser.email ?? null,
    );

    return {
      user: authenticatedUser,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prismaService.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.userId !== payload.sub || session.revokedAt) {
      throw this.createUnauthorizedException();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw this.createUnauthorizedException();
    }

    const tokenMatches = await compare(refreshToken, session.refreshTokenHash);

    if (!tokenMatches) {
      throw this.createUnauthorizedException();
    }

    await this.prismaService.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findByIdForAuth(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw this.createUnauthorizedException();
    }

    const nextSession = await this.issueSessionTokens(user.id, user.email);

    return {
      user: this.usersService.toSafeUser(user),
      accessToken: nextSession.accessToken,
      refreshToken: nextSession.refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prismaService.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.userId !== payload.sub || session.revokedAt) {
      throw this.createUnauthorizedException();
    }

    const tokenMatches = await compare(refreshToken, session.refreshTokenHash);

    if (!tokenMatches) {
      throw this.createUnauthorizedException();
    }

    await this.prismaService.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return {
      message: 'Session closed successfully.',
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw this.createUnauthorizedException();
    }
  }

  private async issueSessionTokens(
    userId: string,
    email: string | null,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Generamos el sessionId en la aplicacion para poder firmar el refresh token
    // y guardar la sesion en una sola creacion coherente.
    const sessionId = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        sessionId,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as JwtDuration,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        sessionId,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as JwtDuration,
      },
    );

    const decodedRefreshToken =
      this.jwtService.decode<RefreshTokenPayload>(refreshToken);

    if (!decodedRefreshToken?.exp) {
      throw this.createUnauthorizedException();
    }

    const refreshTokenHash = await hash(refreshToken, 12);

    await this.prismaService.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private createUnauthorizedException(): UnauthorizedException {
    return new UnauthorizedException('Unauthorized.');
  }
}
