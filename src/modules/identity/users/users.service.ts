import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DocumentType,
  Prisma,
  UserStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UpdateConsumerUserDto } from './dto/update-consumer-user.dto';

const safeUserSelect = {
  id: true,
  email: true,
  documentType: true,
  documentNumber: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  status: true,
  emailVerifiedAt: true,
  documentVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const authUserSelect = {
  ...safeUserSelect,
  passwordHash: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string | null;
    lastName: string | null;
    status: UserStatus;
  }) {
    return this.prismaService.user.create({
      data,
      select: safeUserSelect,
    });
  }

  async findByEmailForAuth(email: string) {
    return this.prismaService.user.findFirst({
      where: { email },
      select: authUserSelect,
    });
  }

  async findByIdentifierForAuth(identifier: string) {
    if (this.isEmailIdentifier(identifier)) {
      const email = identifier.trim().toLowerCase();

      return this.prismaService.user.findFirst({
        where: { email },
        select: authUserSelect,
      });
    }

    const documentNumber = this.normalizeDocument(identifier);

    return this.prismaService.user.findFirst({
      where: { documentNumber },
      select: authUserSelect,
    });
  }

  async findByIdForAuth(userId: string) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: authUserSelect,
    });
  }

  async getCurrentUser(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async updateCurrentUser(
    userId: string,
    updateUserDto: UpdateConsumerUserDto,
  ) {
    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.firstName !== undefined) {
      data.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      data.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.phone !== undefined) {
      data.phone = updateUserDto.phone;
    }

    if (updateUserDto.documentType !== undefined) {
      data.documentType = updateUserDto.documentType;
    }

    if (updateUserDto.documentNumber !== undefined) {
      data.documentNumber =
        updateUserDto.documentNumber === null
          ? null
          : this.normalizeDocument(updateUserDto.documentNumber);
    }

    if (updateUserDto.avatarUrl !== undefined) {
      data.avatarUrl = updateUserDto.avatarUrl;
    }

    try {
      return await this.prismaService.user.update({
        where: { id: userId },
        data,
        select: safeUserSelect,
      });
    } catch (error: unknown) {
      this.handleKnownPrismaErrors(error);
      throw error;
    }
  }

  async markLoginSucceeded(userId: string, lastLoginAt: Date) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        lastLoginAt,
      },
      select: safeUserSelect,
    });
  }

  toSafeUser(user: {
    id: string;
    email: string | null;
    documentType: DocumentType | null;
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
  }) {
    return {
      id: user.id,
      email: user.email,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      documentVerifiedAt: user.documentVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isEmailIdentifier(identifier: string): boolean {
    return identifier.includes('@');
  }

  private normalizeDocument(documentNumber: string): string {
    return documentNumber.trim().toUpperCase().replace(/\s+/g, '');
  }

  private handleKnownPrismaErrors(error: unknown): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A user with that email or document already exists.',
      );
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('User not found.');
    }
  }
}
