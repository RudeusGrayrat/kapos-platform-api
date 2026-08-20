import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashMovementType,
  CashRegisterStatus,
  CashSessionStatus,
  Prisma,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';

@Injectable()
export class CashService {
  constructor(private readonly prismaService: PrismaService) {}

  listRegisters(organizationId: string) {
    return this.prismaService.cashRegister.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        branch: { select: { id: true, name: true, code: true, status: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async createRegister(organizationId: string, input: CreateCashRegisterDto) {
    await this.ensureBranchBelongsToOrganization(
      organizationId,
      input.branchId,
    );

    return this.prismaService.cashRegister.create({
      data: {
        organizationId,
        branchId: input.branchId,
        code: input.code.toLowerCase(),
        name: input.name,
        status: input.status ?? 'ACTIVE',
        sortOrder: input.sortOrder ?? 0,
      },
      include: {
        branch: { select: { id: true, name: true, code: true, status: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async updateRegister(
    organizationId: string,
    cashRegisterId: string,
    input: UpdateCashRegisterDto,
  ) {
    if (input.branchId) {
      await this.ensureBranchBelongsToOrganization(
        organizationId,
        input.branchId,
      );
    }

    return this.prismaService.cashRegister.update({
      where: { id: cashRegisterId, organizationId },
      data: {
        branchId: input.branchId,
        code: input.code?.toLowerCase(),
        name: input.name,
        status: input.status,
        sortOrder: input.sortOrder,
      },
      include: {
        branch: { select: { id: true, name: true, code: true, status: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async listSessions(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: CashSessionStatus;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.CashSessionWhereInput = {
      organizationId: input.organizationId,
      status: input.status,
      ...(search
        ? {
            OR: [
              {
                cashRegister: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                cashRegister: {
                  code: { contains: search, mode: 'insensitive' },
                },
              },
              { branch: { name: { contains: search, mode: 'insensitive' } } },
              {
                openedBy: { email: { contains: search, mode: 'insensitive' } },
              },
            ],
          }
        : {}),
    };

    const [sessions, total] = await Promise.all([
      this.prismaService.cashSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ openedAt: 'desc' }],
        include: this.sessionInclude(),
      }),
      this.prismaService.cashSession.count({ where }),
    ]);

    return {
      data: sessions.map((session) => this.serializeSession(session)),
      total,
      page,
      limit,
    };
  }

  async getOpenSession(
    organizationId: string,
    cashRegisterId?: string,
    branchId?: string,
  ) {
    const session = await this.prismaService.cashSession.findFirst({
      where: {
        organizationId,
        status: CashSessionStatus.OPEN,
        cashRegisterId,
        branchId,
      },
      orderBy: { openedAt: 'desc' },
      include: this.sessionInclude(),
    });

    return session ? this.serializeSession(session) : null;
  }

  async openSession(
    organizationId: string,
    userId: string,
    input: OpenCashSessionDto,
  ) {
    const cashRegister = await this.prismaService.cashRegister.findFirst({
      where: {
        id: input.cashRegisterId,
        organizationId,
        branchId: input.branchId,
        status: CashRegisterStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!cashRegister) {
      throw new BadRequestException(
        'La caja no existe, no esta activa o no pertenece a la sucursal indicada.',
      );
    }

    const existingOpenSession = await this.prismaService.cashSession.findFirst({
      where: {
        cashRegisterId: input.cashRegisterId,
        status: CashSessionStatus.OPEN,
      },
      select: { id: true },
    });

    if (existingOpenSession) {
      throw new BadRequestException('Esta caja ya tiene una apertura activa.');
    }

    const session = await this.prismaService.cashSession.create({
      data: {
        organizationId,
        branchId: input.branchId,
        cashRegisterId: input.cashRegisterId,
        openedByUserId: userId,
        openingAmount: new Prisma.Decimal(input.openingAmount ?? 0),
        openingNote: input.openingNote,
      },
      include: this.sessionInclude(),
    });

    return this.serializeSession(session);
  }

  async listMovements(organizationId: string, cashSessionId: string) {
    await this.ensureSessionBelongsToOrganization(
      organizationId,
      cashSessionId,
    );

    const movements = await this.prismaService.cashMovement.findMany({
      where: { cashSessionId },
      orderBy: [{ occurredAt: 'desc' }],
      include: {
        paymentMethod: {
          select: { id: true, name: true, code: true, type: true },
        },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return movements.map((movement) => this.serializeMovement(movement));
  }

  async createMovement(
    organizationId: string,
    userId: string,
    cashSessionId: string,
    input: CreateCashMovementDto,
  ) {
    const session = await this.prismaService.cashSession.findFirst({
      where: {
        id: cashSessionId,
        organizationId,
        status: CashSessionStatus.OPEN,
      },
      select: { id: true },
    });

    if (!session) {
      throw new BadRequestException(
        'La sesion de caja no existe o ya no esta abierta.',
      );
    }

    if (input.paymentMethodId) {
      await this.ensurePaymentMethodBelongsToOrganization(
        organizationId,
        input.paymentMethodId,
      );
    }

    const movement = await this.prismaService.cashMovement.create({
      data: {
        cashSessionId,
        paymentMethodId: input.paymentMethodId,
        createdByUserId: userId,
        type: input.type,
        amount: new Prisma.Decimal(input.amount),
        concept: input.concept,
        note: input.note,
      },
      include: {
        paymentMethod: {
          select: { id: true, name: true, code: true, type: true },
        },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return this.serializeMovement(movement);
  }

  async closeSession(
    organizationId: string,
    userId: string,
    cashSessionId: string,
    input: CloseCashSessionDto,
  ) {
    const session = await this.prismaService.cashSession.findFirst({
      where: {
        id: cashSessionId,
        organizationId,
        status: CashSessionStatus.OPEN,
      },
      include: { movements: true },
    });

    if (!session) {
      throw new BadRequestException(
        'La sesion de caja no existe o ya fue cerrada.',
      );
    }

    const expectedAmount = this.calculateExpectedAmount(
      session.openingAmount,
      session.movements,
    );
    const countedAmount = new Prisma.Decimal(input.countedAmount);
    const differenceAmount = countedAmount.minus(expectedAmount);

    const closedSession = await this.prismaService.cashSession.update({
      where: { id: cashSessionId },
      data: {
        status: CashSessionStatus.CLOSED,
        closedByUserId: userId,
        expectedAmount,
        countedAmount,
        differenceAmount,
        closingNote: input.closingNote,
        closedAt: new Date(),
      },
      include: this.sessionInclude(),
    });

    return this.serializeSession(closedSession);
  }

  private calculateExpectedAmount(
    openingAmount: Prisma.Decimal,
    movements: Array<{ type: CashMovementType; amount: Prisma.Decimal }>,
  ) {
    return movements.reduce((total, movement) => {
      if (
        movement.type === CashMovementType.EXPENSE ||
        movement.type === CashMovementType.WITHDRAWAL
      ) {
        return total.minus(movement.amount.abs());
      }

      return total.plus(movement.amount);
    }, openingAmount);
  }

  private async ensureBranchBelongsToOrganization(
    organizationId: string,
    branchId: string,
  ) {
    const branch = await this.prismaService.branch.findFirst({
      where: { id: branchId, organizationId },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException(
        'La sucursal no pertenece a la organizacion.',
      );
    }
  }

  private async ensurePaymentMethodBelongsToOrganization(
    organizationId: string,
    paymentMethodId: string,
  ) {
    const paymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: { id: paymentMethodId, organizationId },
      select: { id: true },
    });

    if (!paymentMethod) {
      throw new NotFoundException(
        'El metodo de pago no pertenece a la organizacion.',
      );
    }
  }

  private async ensureSessionBelongsToOrganization(
    organizationId: string,
    cashSessionId: string,
  ) {
    const session = await this.prismaService.cashSession.findFirst({
      where: { id: cashSessionId, organizationId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(
        'La sesion de caja no pertenece a la organizacion.',
      );
    }
  }

  private sessionInclude() {
    return {
      branch: { select: { id: true, name: true, code: true } },
      cashRegister: {
        select: { id: true, name: true, code: true, status: true },
      },
      openedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      closedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      movements: {
        orderBy: { occurredAt: 'desc' as const },
        include: {
          paymentMethod: {
            select: { id: true, name: true, code: true, type: true },
          },
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      },
    };
  }

  private serializeSession(session: {
    openingAmount: Prisma.Decimal;
    expectedAmount: Prisma.Decimal | null;
    countedAmount: Prisma.Decimal | null;
    differenceAmount: Prisma.Decimal | null;
    movements: Array<{ amount: Prisma.Decimal; [key: string]: unknown }>;
    [key: string]: unknown;
  }) {
    return {
      ...session,
      openingAmount: Number(session.openingAmount),
      expectedAmount:
        session.expectedAmount === null ? null : Number(session.expectedAmount),
      countedAmount:
        session.countedAmount === null ? null : Number(session.countedAmount),
      differenceAmount:
        session.differenceAmount === null
          ? null
          : Number(session.differenceAmount),
      movements: session.movements.map((movement) =>
        this.serializeMovement(movement),
      ),
    };
  }

  private serializeMovement(movement: {
    amount: Prisma.Decimal;
    [key: string]: unknown;
  }) {
    return {
      ...movement,
      amount: Number(movement.amount),
    };
  }
}
