import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaService = {
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('updates the consumer profile with normalized document data', async () => {
    prismaService.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'consumer@basti.dev',
      documentType: 'DNI',
      documentNumber: '76466972',
      firstName: 'Juan',
      lastName: 'Perez',
      phone: null,
      avatarUrl: 'https://avatar.test',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      documentVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.updateCurrentUser('user-1', {
      firstName: 'Juan',
      lastName: 'Perez',
      phone: null,
      documentType: 'DNI',
      documentNumber: '76466972',
      avatarUrl: 'https://avatar.test',
    });

    expect(prismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentNumber: '76466972',
          avatarUrl: 'https://avatar.test',
        }),
      }),
    );
  });

  it('returns a conflict when document uniqueness fails', async () => {
    prismaService.user.update.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.updateCurrentUser('user-1', {
        documentNumber: '76466972',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('never includes passwordHash in the safe user shape', () => {
    const safeUser = service.toSafeUser({
      id: 'user-2',
      email: 'consumer@basti.dev',
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

    expect(safeUser).not.toHaveProperty('passwordHash');
    expect(safeUser.status).toBe(UserStatus.ACTIVE);
  });
});
