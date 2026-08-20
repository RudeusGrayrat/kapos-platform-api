import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BranchStatus,
  Prisma,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  CreateDiningAreaDto,
  CreateDiningTableDto,
  UpdateDiningAreaDto,
  UpdateDiningTableDto,
} from './dto/dining-space.dto';

@Injectable()
export class DiningSpacesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listAreas(
    organizationId: string,
    branchIds: string[],
    branchId?: string,
  ) {
    const allowedBranchIds = this.resolveBranchIds(branchIds, branchId);
    await this.ensureDefaultAreas(organizationId, allowedBranchIds);

    return this.prismaService.diningArea
      .findMany({
        where: { organizationId, branchId: { in: allowedBranchIds } },
        orderBy: [{ branchId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          branch: { select: { id: true, name: true, code: true } },
          tables: {
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
              openAccounts: {
                where: { status: { in: ['OPEN', 'PARTIALLY_PAID'] } },
                take: 1,
                orderBy: { openedAt: 'desc' },
                select: {
                  id: true,
                  accountNumber: true,
                  status: true,
                  total: true,
                  paidTotal: true,
                  balance: true,
                  openedAt: true,
                },
              },
              accountLinks: {
                where: {
                  releasedAt: null,
                  openAccount: { status: { in: ['OPEN', 'PARTIALLY_PAID'] } },
                },
                take: 1,
                select: {
                  openAccount: {
                    select: {
                      id: true,
                      accountNumber: true,
                      status: true,
                      total: true,
                      paidTotal: true,
                      balance: true,
                      openedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((areas) =>
        areas.map((area) => ({
          ...area,
          tables: area.tables.map((table) => ({
            ...table,
            activeAccount:
              table.openAccounts[0] || table.accountLinks[0]
                ? this.serializeAmounts(
                    table.openAccounts[0] ?? table.accountLinks[0].openAccount,
                  )
                : null,
            openAccounts: undefined,
            accountLinks: undefined,
          })),
        })),
      );
  }

  async createArea(
    organizationId: string,
    branchIds: string[],
    input: CreateDiningAreaDto,
  ) {
    await this.ensureBranch(organizationId, branchIds, input.branchId);

    try {
      return await this.prismaService.diningArea.create({
        data: {
          organizationId,
          branchId: input.branchId,
          name: input.name.trim(),
          sortOrder: input.sortOrder ?? 0,
        },
      });
    } catch (error) {
      this.handleUniqueError(error, 'Ya existe un area con ese nombre.');
      throw error;
    }
  }

  async updateArea(
    organizationId: string,
    branchIds: string[],
    id: string,
    input: UpdateDiningAreaDto,
  ) {
    const area = await this.prismaService.diningArea.findFirst({
      where: { id, organizationId, branchId: { in: branchIds } },
      select: { id: true },
    });

    if (!area) {
      throw new NotFoundException(
        'El area no existe o no pertenece a tu sucursal.',
      );
    }

    try {
      return await this.prismaService.diningArea.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
      });
    } catch (error) {
      this.handleUniqueError(error, 'Ya existe un area con ese nombre.');
      throw error;
    }
  }

  async createTable(
    organizationId: string,
    branchIds: string[],
    input: CreateDiningTableDto,
  ) {
    await this.ensureBranch(organizationId, branchIds, input.branchId);
    await this.ensureArea(organizationId, input.branchId, input.areaId);

    try {
      return await this.prismaService.diningTable.create({
        data: {
          organizationId,
          branchId: input.branchId,
          areaId: input.areaId,
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          capacity: input.capacity ?? 1,
          sortOrder: input.sortOrder ?? 0,
        },
        include: { area: { select: { id: true, name: true } } },
      });
    } catch (error) {
      this.handleUniqueError(error, 'Ya existe una mesa con ese codigo.');
      throw error;
    }
  }

  async updateTable(
    organizationId: string,
    branchIds: string[],
    id: string,
    input: UpdateDiningTableDto,
  ) {
    const table = await this.prismaService.diningTable.findFirst({
      where: { id, organizationId, branchId: { in: branchIds } },
      select: { id: true, branchId: true },
    });

    if (!table) {
      throw new NotFoundException(
        'La mesa no existe o no pertenece a tu sucursal.',
      );
    }

    if (input.areaId) {
      await this.ensureArea(organizationId, table.branchId, input.areaId);
    }

    try {
      return await this.prismaService.diningTable.update({
        where: { id },
        data: {
          areaId: input.areaId,
          code: input.code?.trim().toUpperCase(),
          name: input.name?.trim(),
          capacity: input.capacity,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
        include: { area: { select: { id: true, name: true } } },
      });
    } catch (error) {
      this.handleUniqueError(error, 'Ya existe una mesa con ese codigo.');
      throw error;
    }
  }

  private resolveBranchIds(branchIds: string[], branchId?: string) {
    if (!branchId) {
      return branchIds;
    }

    if (!branchIds.includes(branchId)) {
      throw new BadRequestException(
        'No tienes acceso a la sucursal seleccionada.',
      );
    }

    return [branchId];
  }

  private async ensureBranch(
    organizationId: string,
    branchIds: string[],
    branchId: string,
  ) {
    if (!branchIds.includes(branchId)) {
      throw new BadRequestException(
        'No tienes acceso a la sucursal seleccionada.',
      );
    }

    const branch = await this.prismaService.branch.findFirst({
      where: { id: branchId, organizationId, status: BranchStatus.ACTIVE },
      select: { id: true },
    });

    if (!branch) {
      throw new BadRequestException('La sucursal no existe o no esta activa.');
    }
  }

  private async ensureArea(
    organizationId: string,
    branchId: string,
    areaId: string,
  ) {
    const area = await this.prismaService.diningArea.findFirst({
      where: { id: areaId, organizationId, branchId, isActive: true },
      select: { id: true },
    });

    if (!area) {
      throw new BadRequestException('El area no existe o no esta activa.');
    }
  }

  private async ensureDefaultAreas(
    organizationId: string,
    branchIds: string[],
  ) {
    if (branchIds.length === 0) return;

    const [branches, existingAreas] = await Promise.all([
      this.prismaService.branch.findMany({
        where: {
          id: { in: branchIds },
          organizationId,
          status: BranchStatus.ACTIVE,
        },
        select: { id: true },
      }),
      this.prismaService.diningArea.findMany({
        where: { organizationId, branchId: { in: branchIds } },
        distinct: ['branchId'],
        select: { branchId: true },
      }),
    ]);
    const configuredBranches = new Set(
      existingAreas.map((area) => area.branchId),
    );
    const missingBranches = branches.filter(
      (branch) => !configuredBranches.has(branch.id),
    );

    if (missingBranches.length > 0) {
      await this.prismaService.diningArea.createMany({
        data: missingBranches.map((branch) => ({
          organizationId,
          branchId: branch.id,
          name: 'Principal',
          sortOrder: 0,
        })),
        skipDuplicates: true,
      });
    }
  }

  private serializeAmounts<
    T extends {
      total: Prisma.Decimal;
      paidTotal: Prisma.Decimal;
      balance: Prisma.Decimal;
    },
  >(value: T) {
    return {
      ...value,
      total: Number(value.total),
      paidTotal: Number(value.paidTotal),
      balance: Number(value.balance),
    };
  }

  private handleUniqueError(error: unknown, message: string): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(message);
    }
  }
}
