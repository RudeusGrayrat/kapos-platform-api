import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingDocumentStatus,
  BillingStatus,
  CashMovementType,
  CashSessionStatus,
  KitchenTicketStatus,
  LoyaltyMovementType,
  OpenAccountEventType,
  OpenAccountItemStatus,
  OpenAccountStatus,
  PaymentIntentStatus,
  Prisma,
  ProductStatus,
  SaleChannel,
  SalePaymentStatus,
  StockMovementType,
  StockStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  AddOpenAccountItemsDto,
  CancelOpenAccountItemDto,
  CancelOpenAccountDto,
  CreateOpenAccountDto,
  GeneratePrebillDto,
  JoinOpenAccountTableDto,
  MoveOpenAccountTableDto,
  RecordOpenAccountPaymentDto,
  ReleaseOpenAccountTableDto,
  SendKitchenTicketDto,
  UpdateKitchenTicketDto,
  UpdateOpenAccountDto,
} from './dto/open-account.dto';

const ACTIVE_ACCOUNT_STATUSES = [
  OpenAccountStatus.OPEN,
  OpenAccountStatus.PARTIALLY_PAID,
];

const KITCHEN_TRANSITIONS: Record<KitchenTicketStatus, KitchenTicketStatus[]> =
  {
    DRAFT: [KitchenTicketStatus.SENT, KitchenTicketStatus.CANCELLED],
    SENT: [KitchenTicketStatus.IN_PREPARATION, KitchenTicketStatus.CANCELLED],
    IN_PREPARATION: [KitchenTicketStatus.READY, KitchenTicketStatus.CANCELLED],
    READY: [KitchenTicketStatus.DELIVERED],
    DELIVERED: [],
    CANCELLED: [],
  };

@Injectable()
export class OpenAccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listAccounts(input: {
    organizationId: string;
    branchIds: string[];
    branchId?: string;
    status?: OpenAccountStatus;
    serviceType?: 'LOCAL' | 'DELIVERY' | 'TAKEAWAY';
    search?: string;
  }) {
    const branchIds = this.resolveBranchIds(input.branchIds, input.branchId);
    const search = input.search?.trim();
    const accounts = await this.prismaService.openAccount.findMany({
      where: {
        organizationId: input.organizationId,
        branchId: { in: branchIds },
        status: input.status ?? { in: ACTIVE_ACCOUNT_STATUSES },
        serviceType: input.serviceType,
        ...(search
          ? {
              OR: [
                {
                  accountNumber: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  customerName: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  customerPhone: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  diningTable: {
                    name: { contains: search, mode: 'insensitive' as const },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
      include: this.accountSummaryInclude(),
    });

    return accounts.map((account) => this.serializeAccount(account));
  }

  async getAccount(
    organizationId: string,
    branchIds: string[],
    accountId: string,
  ) {
    const account = await this.prismaService.openAccount.findFirst({
      where: { id: accountId, organizationId, branchId: { in: branchIds } },
      include: this.accountDetailInclude(),
    });

    if (!account) {
      throw new NotFoundException(
        'La cuenta no existe o no pertenece a tu sucursal.',
      );
    }

    return this.serializeAccount(account);
  }

  async createAccount(
    organizationId: string,
    branchIds: string[],
    userId: string,
    input: CreateOpenAccountDto,
  ) {
    this.assertBranchAccess(branchIds, input.branchId);

    return this.prismaService.$transaction(async (transaction) => {
      await this.ensureActiveBranch(
        transaction,
        organizationId,
        input.branchId,
      );
      await this.validateCustomer(
        transaction,
        organizationId,
        input.customerProfileId ?? undefined,
      );

      if (input.serviceType === 'LOCAL') {
        if (!input.diningTableId) {
          throw new BadRequestException(
            'Selecciona una mesa para el consumo en local.',
          );
        }

        const table = await transaction.diningTable.findFirst({
          where: {
            id: input.diningTableId,
            organizationId,
            branchId: input.branchId,
            isActive: true,
            area: { isActive: true },
          },
          select: { id: true },
        });

        if (!table) {
          throw new BadRequestException('La mesa no existe o no esta activa.');
        }

        const activeAccount = await transaction.openAccount.findFirst({
          where: {
            diningTableId: input.diningTableId,
            status: { in: ACTIVE_ACCOUNT_STATUSES },
          },
          select: { id: true },
        });

        if (activeAccount) {
          throw new ConflictException('La mesa ya tiene una cuenta abierta.');
        }
        const activeLink = await transaction.openAccountTableLink.findFirst({
          where: { diningTableId: input.diningTableId, releasedAt: null },
          select: { id: true },
        });
        if (activeLink) {
          throw new ConflictException(
            'La mesa esta unida a otra cuenta abierta.',
          );
        }
      } else if (input.diningTableId) {
        throw new BadRequestException(
          'Solo los pedidos en local pueden usar una mesa.',
        );
      }

      if (
        input.serviceType === 'DELIVERY' &&
        (!input.customerName?.trim() || !input.deliveryAddress?.trim())
      ) {
        throw new BadRequestException(
          'Para delivery indica el nombre del cliente y la direccion.',
        );
      }

      const account = await transaction.openAccount.create({
        data: {
          organizationId,
          branchId: input.branchId,
          diningTableId: input.diningTableId,
          customerProfileId: input.customerProfileId,
          createdByUserId: userId,
          accountNumber: await this.createAccountNumber(
            organizationId,
            transaction,
          ),
          serviceType: input.serviceType,
          guestCount: input.guestCount,
          customerName: input.customerName?.trim(),
          customerPhone: input.customerPhone?.trim(),
          deliveryAddress: input.deliveryAddress?.trim(),
          deliveryReference: input.deliveryReference?.trim(),
          note: input.note?.trim(),
          events: {
            create: {
              createdByUserId: userId,
              type: OpenAccountEventType.OPENED,
              payload: { serviceType: input.serviceType },
            },
          },
        },
        include: this.accountDetailInclude(),
      });

      return this.serializeAccount(account);
    });
  }

  async updateAccount(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: UpdateOpenAccountDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);
      await this.validateCustomer(
        transaction,
        organizationId,
        input.customerProfileId ?? undefined,
      );
      await this.claimVersion(transaction, account.id, input.expectedVersion);

      await transaction.openAccount.update({
        where: { id: account.id },
        data: {
          customerProfileId: input.customerProfileId,
          guestCount: input.guestCount,
          customerName: input.customerName?.trim(),
          customerPhone: input.customerPhone?.trim(),
          deliveryAddress: input.deliveryAddress?.trim(),
          deliveryReference: input.deliveryReference?.trim(),
          note: input.note?.trim(),
        },
      });

      if (input.customerProfileId) {
        await transaction.openAccountEvent.create({
          data: {
            openAccountId: account.id,
            createdByUserId: userId,
            type: OpenAccountEventType.CUSTOMER_ASSIGNED,
            payload: { customerProfileId: input.customerProfileId },
          },
        });
      }

      return this.findAndSerialize(transaction, account.id);
    });
  }

  async moveAccountTable(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: MoveOpenAccountTableDto,
  ) {
    return this.prismaService.$transaction(
      async (transaction) => {
        const account = await this.findActiveAccount(
          transaction,
          organizationId,
          branchIds,
          accountId,
        );
        this.assertVersion(account.version, input.expectedVersion);
        this.assertLocalAccount(account.serviceType);
        if (account.diningTableId === input.diningTableId) {
          throw new BadRequestException('La cuenta ya esta en esa mesa.');
        }
        await this.ensureTableAvailable(
          transaction,
          organizationId,
          account.branchId,
          input.diningTableId,
        );
        await this.claimVersion(transaction, account.id, input.expectedVersion);
        await transaction.openAccount.update({
          where: { id: account.id },
          data: { diningTableId: input.diningTableId },
        });
        await transaction.openAccountEvent.create({
          data: {
            openAccountId: account.id,
            createdByUserId: userId,
            type: OpenAccountEventType.TABLE_TRANSFERRED,
            payload: {
              fromDiningTableId: account.diningTableId,
              toDiningTableId: input.diningTableId,
            },
          },
        });
        return this.findAndSerialize(transaction, account.id);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async joinAccountTable(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: JoinOpenAccountTableDto,
  ) {
    return this.prismaService.$transaction(
      async (transaction) => {
        const account = await this.findActiveAccount(
          transaction,
          organizationId,
          branchIds,
          accountId,
        );
        this.assertVersion(account.version, input.expectedVersion);
        this.assertLocalAccount(account.serviceType);
        if (account.diningTableId === input.diningTableId) {
          throw new BadRequestException('Esa ya es la mesa principal.');
        }
        await this.ensureTableAvailable(
          transaction,
          organizationId,
          account.branchId,
          input.diningTableId,
        );
        await this.claimVersion(transaction, account.id, input.expectedVersion);
        await transaction.openAccountTableLink.create({
          data: {
            openAccountId: account.id,
            diningTableId: input.diningTableId,
            assignedByUserId: userId,
          },
        });
        await transaction.openAccountEvent.create({
          data: {
            openAccountId: account.id,
            createdByUserId: userId,
            type: OpenAccountEventType.TABLE_JOINED,
            payload: { diningTableId: input.diningTableId },
          },
        });
        return this.findAndSerialize(transaction, account.id);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async releaseAccountTable(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    diningTableId: string,
    input: ReleaseOpenAccountTableDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);
      const link = await transaction.openAccountTableLink.findFirst({
        where: { openAccountId: account.id, diningTableId, releasedAt: null },
        select: { id: true },
      });
      if (!link) {
        throw new NotFoundException('La mesa no esta unida a esta cuenta.');
      }
      await this.claimVersion(transaction, account.id, input.expectedVersion);
      await transaction.openAccountTableLink.update({
        where: { id: link.id },
        data: { releasedAt: new Date() },
      });
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          type: OpenAccountEventType.TABLE_RELEASED,
          payload: { diningTableId },
        },
      });
      return this.findAndSerialize(transaction, account.id);
    });
  }

  async generatePrebill(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: GeneratePrebillDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);
      const activeItems = await transaction.openAccountItem.count({
        where: {
          openAccountId: account.id,
          status: OpenAccountItemStatus.ACTIVE,
        },
      });
      if (activeItems === 0) {
        throw new BadRequestException(
          'Agrega productos antes de generar la precuenta.',
        );
      }
      const generatedAt = new Date();
      await this.claimVersion(transaction, account.id, input.expectedVersion);
      await transaction.openAccount.update({
        where: { id: account.id },
        data: { prebillGeneratedAt: generatedAt },
      });
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          type: OpenAccountEventType.PREBILL_GENERATED,
          payload: { generatedAt: generatedAt.toISOString() },
        },
      });
      return this.findAndSerialize(transaction, account.id);
    });
  }

  async cancelAccountItem(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    itemId: string,
    input: CancelOpenAccountItemDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);
      const item = await transaction.openAccountItem.findFirst({
        where: {
          id: itemId,
          openAccountId: account.id,
          status: OpenAccountItemStatus.ACTIVE,
        },
        include: {
          paymentAllocations: {
            where: { payment: { status: 'CONFIRMED' } },
            select: { quantity: true },
          },
        },
      });
      if (!item) {
        throw new NotFoundException('El producto no existe o ya fue anulado.');
      }
      if (
        item.paymentAllocations.some((allocation) =>
          allocation.quantity.greaterThan(0),
        )
      ) {
        throw new BadRequestException(
          'El producto ya tiene un pago asignado y requiere una devolucion.',
        );
      }
      const nextTotal = account.total.minus(item.total);
      if (nextTotal.lessThan(account.paidTotal)) {
        throw new BadRequestException(
          'La anulacion dejaria la cuenta por debajo del monto ya pagado.',
        );
      }

      await this.claimVersion(transaction, account.id, input.expectedVersion);
      if (item.stockReserved && item.productId) {
        await this.releaseStockReservation(
          transaction,
          account.branchId,
          item.productId,
          item.quantity,
        );
      }
      await transaction.openAccountItem.update({
        where: { id: item.id },
        data: {
          status: OpenAccountItemStatus.CANCELLED,
          cancelledByUserId: userId,
          cancellationReason: input.reason.trim(),
          cancelledAt: new Date(),
          stockReserved: false,
        },
      });
      await transaction.openAccount.update({
        where: { id: account.id },
        data: {
          subtotal: { decrement: item.unitPrice.mul(item.quantity) },
          discountTotal: { decrement: item.discountAmount },
          total: nextTotal,
          balance: nextTotal.minus(account.paidTotal),
        },
      });
      if (item.kitchenTicketId) {
        const remainingItems = await transaction.openAccountItem.count({
          where: {
            kitchenTicketId: item.kitchenTicketId,
            status: OpenAccountItemStatus.ACTIVE,
            id: { not: item.id },
          },
        });
        if (remainingItems === 0) {
          await transaction.kitchenTicket.update({
            where: { id: item.kitchenTicketId },
            data: {
              status: KitchenTicketStatus.CANCELLED,
              cancelledAt: new Date(),
            },
          });
        }
      }
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          type: OpenAccountEventType.ITEM_CANCELLED,
          payload: { itemId: item.id, reason: input.reason.trim() },
        },
      });
      return this.findAndSerialize(transaction, account.id);
    });
  }

  async addItems(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: AddOpenAccountItemsDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);

      const productIds = Array.from(
        new Set(input.items.map((item) => item.productId)),
      );
      const products = await transaction.product.findMany({
        where: {
          id: { in: productIds },
          organizationId,
          status: ProductStatus.ACTIVE,
          availableForPos: true,
        },
        include: { stockItems: { where: { branchId: account.branchId } } },
      });
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'Uno o mas productos no existen o no estan disponibles para POS.',
        );
      }

      let subtotalIncrement = new Prisma.Decimal(0);
      let discountIncrement = new Prisma.Decimal(0);
      const itemsData: Prisma.OpenAccountItemCreateManyOpenAccountInput[] = [];
      const reservationsByProduct = new Map<string, Prisma.Decimal>();

      for (const item of input.items) {
        const product = productsById.get(item.productId);

        if (!product) {
          throw new BadRequestException('Producto invalido.');
        }

        const quantity = new Prisma.Decimal(item.quantity);
        const gross = product.price.mul(quantity);
        const discount = new Prisma.Decimal(item.discountAmount ?? 0);

        if (discount.greaterThan(gross)) {
          throw new BadRequestException(
            `El descuento de "${product.name}" supera el total del item.`,
          );
        }

        if (product.trackStock) {
          const stock = product.stockItems[0];
          if (!stock) {
            throw new BadRequestException(
              `Stock insuficiente para "${product.name}" en esta sucursal.`,
            );
          }
          reservationsByProduct.set(
            product.id,
            (
              reservationsByProduct.get(product.id) ?? new Prisma.Decimal(0)
            ).plus(quantity),
          );
        }

        const lineTotal = gross.minus(discount);
        const taxRate = product.taxRate ?? new Prisma.Decimal(0);
        const taxAmount = taxRate.greaterThan(0)
          ? lineTotal.mul(taxRate).div(taxRate.plus(100))
          : new Prisma.Decimal(0);

        subtotalIncrement = subtotalIncrement.plus(gross);
        discountIncrement = discountIncrement.plus(discount);
        itemsData.push({
          productId: product.id,
          createdByUserId: userId,
          productName: product.name,
          productSku: product.sku,
          quantity,
          unitPrice: product.price,
          taxRate,
          taxAmount,
          discountAmount: discount,
          total: lineTotal,
          note: item.note?.trim(),
          stockReserved: product.trackStock,
        });
      }

      for (const [productId, quantity] of reservationsByProduct) {
        const product = productsById.get(productId);
        if (!product) continue;
        await this.reserveStock(
          transaction,
          account.branchId,
          product.id,
          product.name,
          quantity,
        );
      }

      await this.claimVersion(transaction, account.id, input.expectedVersion);
      await transaction.openAccountItem.createMany({
        data: itemsData.map((item) => ({ ...item, openAccountId: account.id })),
      });
      await transaction.openAccount.update({
        where: { id: account.id },
        data: {
          subtotal: { increment: subtotalIncrement },
          discountTotal: { increment: discountIncrement },
          total: { increment: subtotalIncrement.minus(discountIncrement) },
          balance: { increment: subtotalIncrement.minus(discountIncrement) },
        },
      });
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          type: OpenAccountEventType.ITEM_ADDED,
          payload: { count: input.items.length },
        },
      });

      return this.findAndSerialize(transaction, account.id);
    });
  }

  async sendKitchenTicket(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: SendKitchenTicketDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);

      const items = await transaction.openAccountItem.findMany({
        where: {
          openAccountId: account.id,
          status: OpenAccountItemStatus.ACTIVE,
          kitchenTicketId: null,
          ...(input.itemIds?.length ? { id: { in: input.itemIds } } : {}),
        },
        select: { id: true },
      });

      if (items.length === 0) {
        throw new BadRequestException(
          'No hay productos nuevos para enviar a cocina.',
        );
      }

      const lastTicket = await transaction.kitchenTicket.findFirst({
        where: { openAccountId: account.id },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });
      await this.claimVersion(transaction, account.id, input.expectedVersion);
      const ticket = await transaction.kitchenTicket.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          sequence: (lastTicket?.sequence ?? 0) + 1,
          status: KitchenTicketStatus.SENT,
          note: input.note?.trim(),
        },
      });
      await transaction.openAccountItem.updateMany({
        where: {
          id: { in: items.map((item) => item.id) },
          kitchenTicketId: null,
        },
        data: { kitchenTicketId: ticket.id },
      });
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          type: OpenAccountEventType.KITCHEN_SENT,
          payload: { ticketId: ticket.id, sequence: ticket.sequence },
        },
      });

      return this.findAndSerialize(transaction, account.id);
    });
  }

  async listKitchenTickets(
    organizationId: string,
    branchIds: string[],
    branchId?: string,
    status?: KitchenTicketStatus,
  ) {
    const allowedBranchIds = this.resolveBranchIds(branchIds, branchId);
    const tickets = await this.prismaService.kitchenTicket.findMany({
      where: {
        openAccount: { organizationId, branchId: { in: allowedBranchIds } },
        status,
      },
      orderBy: [{ sentAt: 'asc' }],
      include: {
        openAccount: {
          select: {
            id: true,
            accountNumber: true,
            serviceType: true,
            diningTable: { select: { id: true, name: true, code: true } },
          },
        },
        items: {
          where: { status: OpenAccountItemStatus.ACTIVE },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return tickets.map((ticket) => ({
      ...ticket,
      items: ticket.items.map((item) => this.serializeItem(item)),
    }));
  }

  async updateKitchenTicket(
    organizationId: string,
    branchIds: string[],
    userId: string,
    ticketId: string,
    input: UpdateKitchenTicketDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const ticket = await transaction.kitchenTicket.findFirst({
        where: {
          id: ticketId,
          openAccount: { organizationId, branchId: { in: branchIds } },
        },
        select: { id: true, openAccountId: true, status: true },
      });

      if (!ticket) {
        throw new NotFoundException(
          'La comanda no existe o no pertenece a tu sucursal.',
        );
      }

      const status = input.status as KitchenTicketStatus;
      if (!KITCHEN_TRANSITIONS[ticket.status].includes(status)) {
        throw new BadRequestException(
          `La comanda no puede pasar de ${ticket.status} a ${status}.`,
        );
      }
      const updatedTicket = await transaction.kitchenTicket.update({
        where: { id: ticket.id },
        data: {
          status,
          startedAt:
            status === KitchenTicketStatus.IN_PREPARATION
              ? new Date()
              : undefined,
          readyAt:
            status === KitchenTicketStatus.READY ? new Date() : undefined,
          deliveredAt:
            status === KitchenTicketStatus.DELIVERED ? new Date() : undefined,
          cancelledAt:
            status === KitchenTicketStatus.CANCELLED ? new Date() : undefined,
        },
        include: { items: true },
      });
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: ticket.openAccountId,
          createdByUserId: userId,
          type: OpenAccountEventType.KITCHEN_STATUS_CHANGED,
          payload: { ticketId, status },
        },
      });

      return {
        ...updatedTicket,
        items: updatedTicket.items.map((item) => this.serializeItem(item)),
      };
    });
  }

  async recordPayment(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: RecordOpenAccountPaymentDto,
  ) {
    return this.prismaService.$transaction(
      async (transaction) => {
        const existingPayment = await transaction.openAccountPayment.findUnique(
          {
            where: {
              openAccountId_idempotencyKey: {
                openAccountId: accountId,
                idempotencyKey: input.idempotencyKey.trim(),
              },
            },
            select: { id: true },
          },
        );

        if (existingPayment) {
          return this.findAndSerialize(transaction, accountId);
        }

        const account = await this.findActiveAccount(
          transaction,
          organizationId,
          branchIds,
          accountId,
        );
        this.assertVersion(account.version, input.expectedVersion);

        const amount = new Prisma.Decimal(input.amount);
        if (account.total.lessThanOrEqualTo(0)) {
          throw new BadRequestException(
            'Agrega productos antes de cobrar la cuenta.',
          );
        }
        if (amount.greaterThan(account.balance)) {
          throw new BadRequestException(
            'El pago no puede superar el saldo pendiente.',
          );
        }

        const cashSession = await transaction.cashSession.findFirst({
          where: {
            id: input.cashSessionId,
            organizationId,
            branchId: account.branchId,
            status: CashSessionStatus.OPEN,
          },
          select: { id: true },
        });
        if (!cashSession) {
          throw new BadRequestException(
            'No existe una caja abierta para registrar el pago.',
          );
        }
        if (account.cashSessionId && account.cashSessionId !== cashSession.id) {
          throw new BadRequestException(
            'Todos los pagos de una cuenta deben registrarse en la misma sesion de caja.',
          );
        }

        if (input.paymentMethodId) {
          const method = await transaction.paymentMethod.findFirst({
            where: { id: input.paymentMethodId, organizationId, enabled: true },
            select: { id: true },
          });
          if (!method) {
            throw new BadRequestException(
              'El metodo de pago no existe o no esta activo.',
            );
          }
        }

        if (input.paymentIntentId) {
          const intent = await transaction.paymentIntent.findFirst({
            where: {
              id: input.paymentIntentId,
              organizationId,
              status: PaymentIntentStatus.CONFIRMED,
              saleId: null,
            },
            select: { id: true, amount: true },
          });
          if (!intent || !intent.amount.equals(amount)) {
            throw new BadRequestException(
              'El intento de pago no esta confirmado o no coincide con el monto.',
            );
          }
        }

        const allocations = await this.resolvePaymentAllocations(
          transaction,
          account.id,
          input.allocations,
          amount,
        );

        await this.claimVersion(transaction, account.id, input.expectedVersion);
        const cashMovement = await transaction.cashMovement.create({
          data: {
            cashSessionId: cashSession.id,
            paymentMethodId: input.paymentMethodId,
            createdByUserId: userId,
            type: CashMovementType.INCOME,
            amount,
            concept: `Pago cuenta ${account.accountNumber}`,
            note: input.providerRef
              ? `Referencia ${input.providerRef}`
              : undefined,
          },
        });
        const payment = await transaction.openAccountPayment.create({
          data: {
            organizationId,
            branchId: account.branchId,
            openAccountId: account.id,
            cashSessionId: cashSession.id,
            paymentMethodId: input.paymentMethodId,
            paymentIntentId: input.paymentIntentId,
            cashMovementId: cashMovement.id,
            createdByUserId: userId,
            idempotencyKey: input.idempotencyKey.trim(),
            amount,
            provider: input.provider?.trim(),
            providerRef: input.providerRef?.trim(),
          },
        });
        if (allocations.length > 0) {
          await transaction.openAccountPaymentAllocation.createMany({
            data: allocations.map((allocation) => ({
              openAccountPaymentId: payment.id,
              openAccountItemId: allocation.itemId,
              quantity: allocation.quantity,
              amount: allocation.amount,
            })),
          });
        }

        const nextPaidTotal = account.paidTotal.plus(amount);
        const nextBalance = account.total.minus(nextPaidTotal);
        const isClosed = nextBalance.equals(0);
        await transaction.openAccount.update({
          where: { id: account.id },
          data: {
            cashSessionId: cashSession.id,
            paidTotal: nextPaidTotal,
            balance: nextBalance,
            status: isClosed
              ? OpenAccountStatus.CLOSED
              : OpenAccountStatus.PARTIALLY_PAID,
          },
        });
        await transaction.openAccountEvent.create({
          data: {
            openAccountId: account.id,
            createdByUserId: userId,
            type: OpenAccountEventType.PAYMENT_RECORDED,
            payload: {
              amount: Number(amount),
              idempotencyKey: input.idempotencyKey,
              allocatedItems: allocations.length,
            },
          },
        });

        if (isClosed) {
          await this.finalizeAccount(transaction, account.id, userId, {
            documentType: input.billingDocumentType ?? 'TICKET',
            recipient: input.billingRecipient,
          });
        }

        return this.findAndSerialize(transaction, account.id);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async cancelAccount(
    organizationId: string,
    branchIds: string[],
    userId: string,
    accountId: string,
    input: CancelOpenAccountDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const account = await this.findActiveAccount(
        transaction,
        organizationId,
        branchIds,
        accountId,
      );
      this.assertVersion(account.version, input.expectedVersion);
      if (account.paidTotal.greaterThan(0)) {
        throw new BadRequestException(
          'Una cuenta con pagos requiere un flujo de devolucion y no puede cancelarse directamente.',
        );
      }

      const reservedItems = await transaction.openAccountItem.findMany({
        where: {
          openAccountId: account.id,
          status: OpenAccountItemStatus.ACTIVE,
          stockReserved: true,
          productId: { not: null },
        },
        select: { productId: true, quantity: true },
      });
      const reservations = this.groupItemQuantities(reservedItems);
      for (const [productId, quantity] of reservations) {
        await this.releaseStockReservation(
          transaction,
          account.branchId,
          productId,
          quantity,
        );
      }

      await this.claimVersion(transaction, account.id, input.expectedVersion);
      await transaction.openAccount.update({
        where: { id: account.id },
        data: {
          status: OpenAccountStatus.CANCELLED,
          cancelledAt: new Date(),
          note: account.note
            ? `${account.note}\nCancelacion: ${input.reason.trim()}`
            : `Cancelacion: ${input.reason.trim()}`,
        },
      });
      await transaction.openAccountEvent.create({
        data: {
          openAccountId: account.id,
          createdByUserId: userId,
          type: OpenAccountEventType.CANCELLED,
          payload: { reason: input.reason.trim() },
        },
      });
      await transaction.openAccountTableLink.updateMany({
        where: { openAccountId: account.id, releasedAt: null },
        data: { releasedAt: new Date() },
      });

      return this.findAndSerialize(transaction, account.id);
    });
  }

  private async finalizeAccount(
    transaction: Prisma.TransactionClient,
    accountId: string,
    userId: string,
    billing: {
      documentType: 'BOLETA' | 'FACTURA' | 'TICKET';
      recipient?: RecordOpenAccountPaymentDto['billingRecipient'];
    },
  ) {
    const account = await transaction.openAccount.findUniqueOrThrow({
      where: { id: accountId },
      include: {
        items: { where: { status: OpenAccountItemStatus.ACTIVE } },
        payments: {
          where: { status: 'CONFIRMED' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!account.cashSessionId || account.items.length === 0) {
      throw new BadRequestException(
        'La cuenta no tiene caja o productos para cerrarse.',
      );
    }

    const taxTotal = account.items.reduce(
      (sum, item) => sum.plus(item.taxAmount),
      new Prisma.Decimal(0),
    );
    const saleNumber = await this.createSaleNumber(
      account.organizationId,
      transaction,
    );
    const sale = await transaction.sale.create({
      data: {
        organizationId: account.organizationId,
        branchId: account.branchId,
        cashSessionId: account.cashSessionId,
        customerProfileId: account.customerProfileId,
        createdByUserId: userId,
        saleNumber,
        channel: SaleChannel.WEB_POS,
        billingStatus: BillingStatus.PENDING,
        subtotal: account.subtotal,
        taxTotal,
        discountTotal: account.discountTotal,
        total: account.total,
        paidTotal: account.paidTotal,
        changeTotal: 0,
        note: account.note,
        items: {
          createMany: {
            data: account.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              discountAmount: item.discountAmount,
              total: item.total,
              note: item.note,
            })),
          },
        },
        billingDocuments: {
          create: {
            organizationId: account.organizationId,
            type: billing.documentType,
            status: BillingDocumentStatus.PENDING,
            ...this.billingRecipientData(
              billing.documentType,
              billing.recipient,
            ),
          },
        },
      },
    });

    for (const payment of account.payments) {
      await transaction.salePayment.create({
        data: {
          saleId: sale.id,
          paymentMethodId: payment.paymentMethodId,
          cashMovementId: payment.cashMovementId,
          paymentIntentId: payment.paymentIntentId,
          status: SalePaymentStatus.CONFIRMED,
          amount: payment.amount,
          provider: payment.provider,
          providerRef: payment.providerRef,
        },
      });

      if (payment.paymentIntentId) {
        await transaction.paymentIntent.update({
          where: { id: payment.paymentIntentId },
          data: { saleId: sale.id },
        });
      }
    }

    const quantitiesByProduct = new Map<
      string,
      { total: Prisma.Decimal; reserved: Prisma.Decimal }
    >();
    for (const item of account.items) {
      if (!item.productId) continue;
      const current = quantitiesByProduct.get(item.productId) ?? {
        total: new Prisma.Decimal(0),
        reserved: new Prisma.Decimal(0),
      };
      quantitiesByProduct.set(item.productId, {
        total: current.total.plus(item.quantity),
        reserved: item.stockReserved
          ? current.reserved.plus(item.quantity)
          : current.reserved,
      });
    }

    for (const [productId, quantities] of quantitiesByProduct) {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: { name: true, trackStock: true },
      });
      if (!product?.trackStock) continue;

      const stock = await transaction.productStock.findUnique({
        where: {
          productId_branchId: { productId, branchId: account.branchId },
        },
      });
      const unreservedQuantity = quantities.total.minus(quantities.reserved);
      if (
        !stock ||
        stock.quantity.lessThan(quantities.total) ||
        stock.reservedQuantity.lessThan(quantities.reserved) ||
        stock.quantity
          .minus(stock.reservedQuantity)
          .lessThan(unreservedQuantity)
      ) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}".`,
        );
      }
      const updatedStock = await transaction.productStock.update({
        where: { id: stock.id },
        data: {
          quantity: { decrement: quantities.total },
          reservedQuantity: { decrement: quantities.reserved },
        },
      });
      await transaction.productStock.update({
        where: { id: updatedStock.id },
        data: {
          status: this.resolveStockStatus(
            updatedStock.quantity,
            updatedStock.minQuantity,
          ),
        },
      });
      await transaction.stockMovement.create({
        data: {
          organizationId: account.organizationId,
          branchId: account.branchId,
          productId,
          saleId: sale.id,
          createdByUserId: userId,
          type: StockMovementType.SALE,
          quantity: quantities.total.mul(-1),
          balanceAfter: updatedStock.quantity,
          note: `Venta ${saleNumber} desde cuenta ${account.accountNumber}`,
        },
      });
    }

    if (account.customerProfileId) {
      const wallet = await transaction.loyaltyWallet.upsert({
        where: { customerProfileId: account.customerProfileId },
        create: {
          organizationId: account.organizationId,
          customerProfileId: account.customerProfileId,
          redeemablePoints: 0,
          lifetimePoints: 0,
        },
        update: {},
      });
      const earnedPoints = Math.floor(Number(account.total) / 5);
      if (earnedPoints > 0) {
        const redeemablePoints = wallet.redeemablePoints + earnedPoints;
        const lifetimePoints = wallet.lifetimePoints + earnedPoints;
        await transaction.loyaltyWallet.update({
          where: { id: wallet.id },
          data: { redeemablePoints, lifetimePoints },
        });
        await transaction.loyaltyMovement.create({
          data: {
            organizationId: account.organizationId,
            customerProfileId: account.customerProfileId,
            saleId: sale.id,
            type: LoyaltyMovementType.EARN,
            points: earnedPoints,
            redeemableBalanceAfter: redeemablePoints,
            lifetimeBalanceAfter: lifetimePoints,
            reason: `Puntos por venta ${saleNumber}`,
          },
        });
      }
    }

    await transaction.openAccount.update({
      where: { id: account.id },
      data: {
        saleId: sale.id,
        closedByUserId: userId,
        closedAt: new Date(),
        status: OpenAccountStatus.CLOSED,
      },
    });
    await transaction.openAccountTableLink.updateMany({
      where: { openAccountId: account.id, releasedAt: null },
      data: { releasedAt: new Date() },
    });
    await transaction.openAccountEvent.create({
      data: {
        openAccountId: account.id,
        createdByUserId: userId,
        type: OpenAccountEventType.CLOSED,
        payload: { saleId: sale.id, saleNumber },
      },
    });
  }

  private billingRecipientData(
    documentType: 'BOLETA' | 'FACTURA' | 'TICKET',
    recipient?: RecordOpenAccountPaymentDto['billingRecipient'],
  ): Partial<
    Pick<
      Prisma.BillingDocumentUncheckedCreateWithoutSaleInput,
      | 'recipientDocumentType'
      | 'recipientDocumentNumber'
      | 'recipientName'
      | 'recipientAddress'
      | 'recipientEmail'
    >
  > {
    if (documentType === 'FACTURA') {
      const documentNumber = recipient?.documentNumber?.trim() ?? '';
      const name = recipient?.name?.trim() ?? '';
      if (!/^\d{11}$/.test(documentNumber) || !name) {
        throw new BadRequestException(
          'Para emitir factura ingresa RUC de 11 digitos y razon social.',
        );
      }
      return {
        recipientDocumentType: 'RUC',
        recipientDocumentNumber: documentNumber,
        recipientName: name,
        recipientAddress: recipient?.address?.trim() || null,
        recipientEmail: recipient?.email?.trim() || null,
      };
    }

    if (!recipient) return {};

    return {
      recipientDocumentType: recipient.documentType?.trim() || null,
      recipientDocumentNumber: recipient.documentNumber?.trim() || null,
      recipientName: recipient.name?.trim() || null,
      recipientAddress: recipient.address?.trim() || null,
      recipientEmail: recipient.email?.trim() || null,
    };
  }

  private assertLocalAccount(serviceType: string) {
    if (serviceType !== 'LOCAL') {
      throw new BadRequestException(
        'Solo una cuenta de consumo local puede administrar mesas.',
      );
    }
  }

  private async ensureTableAvailable(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    branchId: string,
    diningTableId: string,
  ) {
    const table = await transaction.diningTable.findFirst({
      where: {
        id: diningTableId,
        organizationId,
        branchId,
        isActive: true,
        area: { isActive: true },
      },
      select: {
        id: true,
        openAccounts: {
          where: { status: { in: ACTIVE_ACCOUNT_STATUSES } },
          take: 1,
          select: { id: true },
        },
        accountLinks: {
          where: { releasedAt: null },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!table) {
      throw new BadRequestException('La mesa no existe o no esta activa.');
    }
    if (table.openAccounts.length > 0 || table.accountLinks.length > 0) {
      throw new ConflictException('La mesa ya pertenece a una cuenta abierta.');
    }
  }

  private async reserveStock(
    transaction: Prisma.TransactionClient,
    branchId: string,
    productId: string,
    productName: string,
    quantity: Prisma.Decimal,
  ) {
    const stock = await transaction.productStock.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    const maxReserved = stock?.quantity.minus(quantity);
    if (!stock || !maxReserved || maxReserved.lessThan(0)) {
      throw new BadRequestException(
        `Stock insuficiente para "${productName}" en esta sucursal.`,
      );
    }
    const update = await transaction.productStock.updateMany({
      where: { id: stock.id, reservedQuantity: { lte: maxReserved } },
      data: { reservedQuantity: { increment: quantity } },
    });
    if (update.count !== 1) {
      throw new BadRequestException(
        `Stock insuficiente para "${productName}" en esta sucursal.`,
      );
    }
  }

  private async releaseStockReservation(
    transaction: Prisma.TransactionClient,
    branchId: string,
    productId: string,
    quantity: Prisma.Decimal,
  ) {
    const update = await transaction.productStock.updateMany({
      where: {
        productId,
        branchId,
        reservedQuantity: { gte: quantity },
      },
      data: { reservedQuantity: { decrement: quantity } },
    });
    if (update.count !== 1) {
      throw new ConflictException(
        'La reserva de stock cambio. Actualiza e intenta nuevamente.',
      );
    }
  }

  private groupItemQuantities(
    items: Array<{ productId: string | null; quantity: Prisma.Decimal }>,
  ) {
    const quantities = new Map<string, Prisma.Decimal>();
    for (const item of items) {
      if (!item.productId) continue;
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? new Prisma.Decimal(0)).plus(
          item.quantity,
        ),
      );
    }
    return quantities;
  }

  private async resolvePaymentAllocations(
    transaction: Prisma.TransactionClient,
    accountId: string,
    input: RecordOpenAccountPaymentDto['allocations'],
    paymentAmount: Prisma.Decimal,
  ) {
    if (!input?.length) return [];

    const requestedByItem = new Map<string, Prisma.Decimal>();
    for (const allocation of input) {
      requestedByItem.set(
        allocation.itemId,
        (requestedByItem.get(allocation.itemId) ?? new Prisma.Decimal(0)).plus(
          allocation.quantity,
        ),
      );
    }
    const items = await transaction.openAccountItem.findMany({
      where: {
        id: { in: Array.from(requestedByItem.keys()) },
        openAccountId: accountId,
        status: OpenAccountItemStatus.ACTIVE,
      },
      include: {
        paymentAllocations: {
          where: { payment: { status: 'CONFIRMED' } },
          select: { quantity: true },
        },
      },
    });
    if (items.length !== requestedByItem.size) {
      throw new BadRequestException(
        'Uno o mas productos seleccionados no pertenecen a la cuenta.',
      );
    }

    let allocatedAmount = new Prisma.Decimal(0);
    const allocations = items.map((item) => {
      const quantity = requestedByItem.get(item.id) ?? new Prisma.Decimal(0);
      const paidQuantity = item.paymentAllocations.reduce(
        (sum, allocation) => sum.plus(allocation.quantity),
        new Prisma.Decimal(0),
      );
      const remainingQuantity = item.quantity.minus(paidQuantity);
      if (
        quantity.lessThanOrEqualTo(0) ||
        quantity.greaterThan(remainingQuantity)
      ) {
        throw new BadRequestException(
          `La cantidad seleccionada de "${item.productName}" supera lo pendiente.`,
        );
      }
      const amount = item.total
        .div(item.quantity)
        .mul(quantity)
        .toDecimalPlaces(2);
      allocatedAmount = allocatedAmount.plus(amount);
      return { itemId: item.id, quantity, amount };
    });

    if (allocatedAmount.minus(paymentAmount).abs().greaterThan(0.01)) {
      throw new BadRequestException(
        `El pago por productos debe ser ${allocatedAmount.toFixed(2)}.`,
      );
    }
    return allocations;
  }

  private async findActiveAccount(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    branchIds: string[],
    accountId: string,
  ) {
    const account = await transaction.openAccount.findFirst({
      where: {
        id: accountId,
        organizationId,
        branchId: { in: branchIds },
        status: { in: ACTIVE_ACCOUNT_STATUSES },
      },
    });
    if (!account) {
      throw new NotFoundException(
        'La cuenta no existe, ya cerro o no pertenece a tu sucursal.',
      );
    }
    return account;
  }

  private async claimVersion(
    transaction: Prisma.TransactionClient,
    accountId: string,
    expectedVersion: number,
  ) {
    const updated = await transaction.openAccount.updateMany({
      where: {
        id: accountId,
        version: expectedVersion,
        status: { in: ACTIVE_ACCOUNT_STATUSES },
      },
      data: { version: { increment: 1 } },
    });
    if (updated.count !== 1) {
      throw new ConflictException(
        'La cuenta cambio en otro dispositivo. Actualiza e intenta nuevamente.',
      );
    }
  }

  private assertVersion(currentVersion: number, expectedVersion: number) {
    if (currentVersion !== expectedVersion) {
      throw new ConflictException(
        'La cuenta cambio en otro dispositivo. Actualiza e intenta nuevamente.',
      );
    }
  }

  private resolveBranchIds(branchIds: string[], branchId?: string) {
    if (!branchId) return branchIds;
    this.assertBranchAccess(branchIds, branchId);
    return [branchId];
  }

  private assertBranchAccess(branchIds: string[], branchId: string) {
    if (!branchIds.includes(branchId)) {
      throw new BadRequestException(
        'No tienes acceso a la sucursal seleccionada.',
      );
    }
  }

  private async ensureActiveBranch(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    branchId: string,
  ) {
    const branch = await transaction.branch.findFirst({
      where: { id: branchId, organizationId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!branch)
      throw new BadRequestException('La sucursal no existe o no esta activa.');
  }

  private async validateCustomer(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    customerProfileId?: string,
  ) {
    if (!customerProfileId) return;
    const customer = await transaction.customerProfile.findFirst({
      where: { id: customerProfileId, organizationId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!customer) {
      throw new BadRequestException(
        'El cliente no pertenece a la organizacion activa.',
      );
    }
  }

  private async createAccountNumber(
    organizationId: string,
    transaction: Prisma.TransactionClient,
  ) {
    return this.createUniqueNumber(
      'C',
      organizationId,
      transaction,
      'openAccount',
    );
  }

  private async createSaleNumber(
    organizationId: string,
    transaction: Prisma.TransactionClient,
  ) {
    return this.createUniqueNumber('V', organizationId, transaction, 'sale');
  }

  private async createUniqueNumber(
    prefix: string,
    organizationId: string,
    transaction: Prisma.TransactionClient,
    model: 'openAccount' | 'sale',
  ) {
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const value = `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const exists =
        model === 'openAccount'
          ? await transaction.openAccount.findFirst({
              where: { organizationId, accountNumber: value },
              select: { id: true },
            })
          : await transaction.sale.findFirst({
              where: { organizationId, saleNumber: value },
              select: { id: true },
            });
      if (!exists) return value;
    }

    throw new BadRequestException(
      `No se pudo generar el numero de ${prefix === 'C' ? 'cuenta' : 'venta'}.`,
    );
  }

  private resolveStockStatus(
    quantity: Prisma.Decimal,
    minimum: Prisma.Decimal,
  ) {
    if (quantity.lessThanOrEqualTo(0)) return StockStatus.OUT;
    if (quantity.lessThanOrEqualTo(minimum)) return StockStatus.LOW;
    return StockStatus.OK;
  }

  private accountSummaryInclude() {
    return {
      branch: { select: { id: true, name: true, code: true } },
      diningTable: {
        select: {
          id: true,
          code: true,
          name: true,
          area: { select: { id: true, name: true } },
        },
      },
      tableLinks: {
        where: { releasedAt: null },
        orderBy: { assignedAt: 'asc' as const },
        include: {
          diningTable: {
            select: {
              id: true,
              code: true,
              name: true,
              area: { select: { id: true, name: true } },
            },
          },
        },
      },
      customerProfile: {
        select: {
          id: true,
          externalCustomerCode: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              documentType: true,
              documentNumber: true,
            },
          },
        },
      },
      items: {
        where: { status: OpenAccountItemStatus.ACTIVE },
        orderBy: { createdAt: 'asc' as const },
        include: {
          kitchenTicket: { select: { id: true, sequence: true, status: true } },
          paymentAllocations: {
            where: { payment: { status: 'CONFIRMED' } },
            select: { quantity: true, amount: true },
          },
        },
      },
      _count: { select: { items: true, kitchenTickets: true, payments: true } },
    } as const;
  }

  private accountDetailInclude() {
    return {
      ...this.accountSummaryInclude(),
      cashSession: { select: { id: true, status: true, openedAt: true } },
      sale: {
        select: {
          id: true,
          saleNumber: true,
          status: true,
          billingDocuments: {
            orderBy: { createdAt: 'desc' as const },
            take: 1,
            select: { id: true, type: true, status: true, pdfUrl: true },
          },
        },
      },
      items: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          kitchenTicket: { select: { id: true, sequence: true, status: true } },
          paymentAllocations: {
            where: { payment: { status: 'CONFIRMED' } },
            select: { quantity: true, amount: true },
          },
        },
      },
      kitchenTickets: {
        orderBy: { sequence: 'asc' as const },
        include: {
          items: {
            orderBy: { createdAt: 'asc' as const },
            include: {
              paymentAllocations: {
                where: { payment: { status: 'CONFIRMED' } },
                select: { quantity: true, amount: true },
              },
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          paymentMethod: {
            select: { id: true, code: true, name: true, type: true },
          },
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          allocations: {
            select: { openAccountItemId: true, quantity: true, amount: true },
          },
        },
      },
      events: { orderBy: { createdAt: 'asc' as const } },
    } as const;
  }

  private async findAndSerialize(
    transaction: Prisma.TransactionClient,
    accountId: string,
  ) {
    const account = await transaction.openAccount.findUniqueOrThrow({
      where: { id: accountId },
      include: this.accountDetailInclude(),
    });
    return this.serializeAccount(account);
  }

  private serializeItem<
    T extends {
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      total: Prisma.Decimal;
      paymentAllocations?: Array<{
        quantity: Prisma.Decimal;
        amount: Prisma.Decimal;
      }>;
    },
  >(item: T) {
    const paidQuantity = (item.paymentAllocations ?? []).reduce(
      (sum, allocation) => sum.plus(allocation.quantity),
      new Prisma.Decimal(0),
    );
    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      taxAmount: Number(item.taxAmount),
      discountAmount: Number(item.discountAmount),
      total: Number(item.total),
      paidQuantity: Number(paidQuantity),
      remainingQuantity: Number(item.quantity.minus(paidQuantity)),
      paymentAllocations: item.paymentAllocations?.map((allocation) => ({
        quantity: Number(allocation.quantity),
        amount: Number(allocation.amount),
      })),
    };
  }

  private serializeAccount(
    account: Record<string, unknown> & {
      subtotal: Prisma.Decimal;
      discountTotal: Prisma.Decimal;
      total: Prisma.Decimal;
      paidTotal: Prisma.Decimal;
      balance: Prisma.Decimal;
      items?: Array<Parameters<OpenAccountsService['serializeItem']>[0]>;
      kitchenTickets?: Array<
        Record<string, unknown> & {
          items: Array<Parameters<OpenAccountsService['serializeItem']>[0]>;
        }
      >;
      payments?: Array<
        Record<string, unknown> & {
          amount: Prisma.Decimal;
          allocations?: Array<{
            openAccountItemId: string;
            quantity: Prisma.Decimal;
            amount: Prisma.Decimal;
          }>;
        }
      >;
    },
  ) {
    return {
      ...account,
      subtotal: Number(account.subtotal),
      discountTotal: Number(account.discountTotal),
      total: Number(account.total),
      paidTotal: Number(account.paidTotal),
      balance: Number(account.balance),
      items: account.items?.map((item) => this.serializeItem(item)),
      kitchenTickets: account.kitchenTickets?.map((ticket) => ({
        ...ticket,
        items: ticket.items.map((item) => this.serializeItem(item)),
      })),
      payments: account.payments?.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        allocations: payment.allocations?.map((allocation) => ({
          ...allocation,
          quantity: Number(allocation.quantity),
          amount: Number(allocation.amount),
        })),
      })),
    };
  }
}
