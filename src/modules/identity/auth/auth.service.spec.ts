import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (value: string) => `hashed:${value}`),
  compare: jest.fn(
    async (value: string, hashed: string) => hashed === `hashed:${value}`,
  ),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaService = {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const usersService = {
    findByEmailForAuth: jest.fn(),
    createUser: jest.fn(),
    findByIdentifierForAuth: jest.fn(),
    markLoginSucceeded: jest.fn(),
    findByIdForAuth: jest.fn(),
    toSafeUser: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') {
        return 'test';
      }

      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };

      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    jwtService.signAsync.mockReset();
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jwtService.verifyAsync.mockReset();
    jwtService.decode.mockReturnValue({ exp: 9999999999 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a consumer with email and password', async () => {
    usersService.findByEmailForAuth.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'consumer@basti.dev',
      documentType: null,
      documentNumber: null,
      firstName: null,
      lastName: null,
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.registerConsumer({
      email: 'consumer@basti.dev',
      password: 'StrongPass123!',
    });

    expect(usersService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'consumer@basti.dev',
        firstName: null,
        lastName: null,
        status: UserStatus.ACTIVE,
      }),
    );
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('registers a consumer with optional names', async () => {
    usersService.findByEmailForAuth.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-2',
      email: 'consumer2@basti.dev',
      documentType: null,
      documentNumber: null,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.registerConsumer({
      email: 'consumer2@basti.dev',
      password: 'StrongPass123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(usersService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    );
  });

  it('rejects duplicate email on registration', async () => {
    usersService.findByEmailForAuth.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.registerConsumer({
        email: 'consumer@basti.dev',
        password: 'StrongPass123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in using email identifier', async () => {
    const user = {
      id: 'user-3',
      email: 'login@basti.dev',
      passwordHash: 'hashed:StrongPass123!',
      documentType: null,
      documentNumber: null,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const safeUser = {
      ...user,
      passwordHash: undefined,
      lastLoginAt: new Date(),
    };

    usersService.findByIdentifierForAuth.mockResolvedValue(user);
    usersService.markLoginSucceeded.mockResolvedValue(safeUser);
    jwtService.signAsync
      .mockResolvedValueOnce('access-1')
      .mockResolvedValueOnce('refresh-1');

    const result = await service.loginLocal({
      identifier: 'login@basti.dev',
      password: 'StrongPass123!',
    });

    expect(usersService.findByIdentifierForAuth).toHaveBeenCalledWith(
      'login@basti.dev',
    );
    expect(usersService.markLoginSucceeded).toHaveBeenCalled();
    expect(result.user).toEqual(safeUser);
  });

  it('logs in using document identifier', async () => {
    const user = {
      id: 'user-4',
      email: null,
      passwordHash: 'hashed:StrongPass123!',
      documentType: 'DNI',
      documentNumber: '76466972',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const safeUser = {
      ...user,
      passwordHash: undefined,
      lastLoginAt: new Date(),
    };

    usersService.findByIdentifierForAuth.mockResolvedValue(user);
    usersService.markLoginSucceeded.mockResolvedValue(safeUser);
    jwtService.signAsync
      .mockResolvedValueOnce('access-2')
      .mockResolvedValueOnce('refresh-2');

    await service.loginLocal({
      identifier: '76466972',
      password: 'StrongPass123!',
    });

    expect(usersService.findByIdentifierForAuth).toHaveBeenCalledWith(
      '76466972',
    );
  });

  it('returns the same invalid credentials error for unknown identifier and wrong password', async () => {
    usersService.findByIdentifierForAuth.mockResolvedValueOnce(null);

    await expect(
      service.loginLocal({
        identifier: 'unknown@basti.dev',
        password: 'StrongPass123!',
      }),
    ).rejects.toThrow('Invalid credentials.');

    usersService.findByIdentifierForAuth.mockResolvedValueOnce({
      id: 'user-5',
      email: 'known@basti.dev',
      passwordHash: 'hashed:another-password',
      documentType: null,
      documentNumber: null,
      firstName: null,
      lastName: null,
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.loginLocal({
        identifier: 'known@basti.dev',
        password: 'StrongPass123!',
      }),
    ).rejects.toThrow('Invalid credentials.');
  });

  it('rejects local login when the user has no passwordHash', async () => {
    usersService.findByIdentifierForAuth.mockResolvedValue({
      id: 'user-6',
      email: 'invited@basti.dev',
      passwordHash: null,
      documentType: null,
      documentNumber: null,
      firstName: null,
      lastName: null,
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.loginLocal({
        identifier: 'invited@basti.dev',
        password: 'StrongPass123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes an existing session and keeps old sessions compatible', async () => {
    const user = {
      id: 'user-7',
      email: 'refresh@basti.dev',
      passwordHash: 'hashed:StrongPass123!',
      documentType: null,
      documentNumber: null,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      avatarUrl: null,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-7',
      email: 'refresh@basti.dev',
      sessionId: 'session-7',
      exp: 9999999999,
    });
    prismaService.session.findUnique.mockResolvedValue({
      id: 'session-7',
      userId: 'user-7',
      refreshTokenHash: 'hashed:refresh-token',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prismaService.session.update.mockResolvedValue({ id: 'session-7' });
    usersService.findByIdForAuth.mockResolvedValue(user);
    usersService.toSafeUser.mockReturnValue({
      ...user,
      passwordHash: undefined,
    });
    jwtService.signAsync.mockReset();
    jwtService.signAsync
      .mockResolvedValueOnce('access-7')
      .mockResolvedValueOnce('refresh-7');

    const result = await service.refresh('refresh-token');

    expect(prismaService.session.update).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-7');
    expect(result.refreshToken).toBe('refresh-7');
  });
});
