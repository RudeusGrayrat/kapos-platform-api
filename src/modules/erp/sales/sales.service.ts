import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingStatus,
  CashMovementType,
  CashSessionStatus,
  LoyaltyMovementType,
  PaymentIntentStatus,
  Prisma,
  ProductStatus,
  SaleChannel,
  SalePaymentStatus,
  SaleStatus,
  StockMovementType,
  StockStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listSales(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.SaleWhereInput = {
      organizationId: input.organizationId,
      ...(search
        ? {
            OR: [
              { saleNumber: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
              { branch: { name: { contains: search, mode: 'insensitive' } } },
              {
                createdBy: { email: { contains: search, mode: 'insensitive' } },
              },
              {
                customerProfile: {
                  user: {
                    OR: [
                      { firstName: { contains: search, mode: 'insensitive' } },
                      { lastName: { contains: search, mode: 'insensitive' } },
                      {
                        documentNumber: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
              {
                items: {
                  some: {
                    productName: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [sales, total] = await Promise.all([
      this.prismaService.sale.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ soldAt: 'desc' }],
        include: this.saleInclude(),
      }),
      this.prismaService.sale.count({ where }),
    ]);

    return {
      data: sales.map((sale) => this.serializeSale(sale)),
      total,
      page,
      limit,
    };
  }

  async createSale(
    organizationId: string,
    userId: string,
    input: CreateSaleDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const cashSession = await transaction.cashSession.findFirst({
        where: {
          id: input.cashSessionId,
          organizationId,
          branchId: input.branchId,
          status: CashSessionStatus.OPEN,
        },
        select: { id: true, branchId: true },
      });

      if (!cashSession) {
        throw new BadRequestException(
          'No existe una caja abierta para registrar esta venta.',
        );
      }

      if (input.customerProfileId) {
        const customerProfile = await transaction.customerProfile.findFirst({
          where: { id: input.customerProfileId, organizationId },
          select: { id: true },
        });

        if (!customerProfile) {
          throw new BadRequestException(
            'El cliente no pertenece a la organizacion activa.',
          );
        }
      }

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
        include: {
          stockItems: {
            where: { branchId: input.branchId },
          },
        },
      });
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'Uno o mas productos no existen, no estan activos o no estan disponibles para POS.',
        );
      }

      let subtotal = new Prisma.Decimal(0);
      let itemDiscountTotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);
      const saleItemsData: Prisma.SaleItemCreateManySaleInput[] = [];

      for (const item of input.items) {
        const product = productsById.get(item.productId);

        if (!product) {
          throw new BadRequestException('Producto invalido en la venta.');
        }

        const quantity = new Prisma.Decimal(item.quantity);
        const unitPrice = product.price;
        const lineGross = unitPrice.mul(quantity);
        const discountAmount = new Prisma.Decimal(item.discountAmount ?? 0);

        if (discountAmount.greaterThan(lineGross)) {
          throw new BadRequestException(
            `El descuento de "${product.name}" no puede superar el total del item.`,
          );
        }

        if (product.trackStock) {
          const stockItem = product.stockItems[0];

          if (!stockItem || stockItem.quantity.lessThan(quantity)) {
            throw new BadRequestException(
              `Stock insuficiente para "${product.name}" en esta sucursal.`,
            );
          }
        }

        const lineTotal = lineGross.minus(discountAmount);
        const taxRate = product.taxRate ?? new Prisma.Decimal(0);
        const taxAmount = taxRate.greaterThan(0)
          ? lineTotal.mul(taxRate).div(taxRate.plus(100))
          : new Prisma.Decimal(0);

        subtotal = subtotal.plus(lineGross);
        itemDiscountTotal = itemDiscountTotal.plus(discountAmount);
        taxTotal = taxTotal.plus(taxAmount);

        saleItemsData.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity,
          unitPrice,
          taxRate,
          taxAmount,
          discountAmount,
          total: lineTotal,
          note: item.note,
        });
      }

      const loyaltyPointsToRedeem = Math.max(
        0,
        input.loyaltyPointsToRedeem ?? 0,
      );
      const loyaltyDiscount = new Prisma.Decimal(loyaltyPointsToRedeem);

      if (loyaltyPointsToRedeem > 0 && !input.customerProfileId) {
        throw new BadRequestException(
          'Para canjear puntos debes identificar al cliente.',
        );
      }

      if (loyaltyPointsToRedeem > 0 && input.customerProfileId) {
        const wallet = await transaction.loyaltyWallet.findUnique({
          where: { customerProfileId: input.customerProfileId },
          select: { redeemablePoints: true },
        });

        if (!wallet || wallet.redeemablePoints < loyaltyPointsToRedeem) {
          throw new BadRequestException(
            'El cliente no tiene puntos suficientes para este canje.',
          );
        }
      }

      const globalDiscount = new Prisma.Decimal(input.discountTotal ?? 0).plus(
        loyaltyDiscount,
      );
      const discountTotal = itemDiscountTotal.plus(globalDiscount);
      const total = subtotal.minus(discountTotal);

      if (total.lessThanOrEqualTo(0)) {
        throw new BadRequestException(
          'El total de la venta debe ser mayor a cero.',
        );
      }

      const confirmedPaidTotal = input.payments.reduce((sum, payment) => {
        if ((payment.status ?? 'CONFIRMED') !== 'CONFIRMED') {
          return sum;
        }

        return sum.plus(payment.amount);
      }, new Prisma.Decimal(0));

      if (confirmedPaidTotal.lessThan(total)) {
        throw new BadRequestException(
          'El total pagado confirmado no cubre el total de la venta.',
        );
      }

      const saleNumber = await this.createSaleNumber(
        organizationId,
        transaction,
      );
      const sale = await transaction.sale.create({
        data: {
          organizationId,
          branchId: input.branchId,
          cashSessionId: input.cashSessionId,
          customerProfileId: input.customerProfileId,
          createdByUserId: userId,
          saleNumber,
          channel: input.channel ?? 'WEB_POS',
          billingStatus: BillingStatus.PENDING,
          subtotal,
          taxTotal,
          discountTotal,
          total,
          paidTotal: confirmedPaidTotal,
          changeTotal: confirmedPaidTotal.minus(total),
          note: input.note,
          items: { createMany: { data: saleItemsData } },
          billingDocuments: {
            create: {
              organizationId,
              type: input.billingDocumentType ?? 'TICKET',
              status: BillingDocumentStatus.PENDING,
              ...this.billingRecipientData(
                input.billingDocumentType ?? 'TICKET',
                input.billingRecipient,
              ),
            },
          },
        },
        include: this.saleInclude(),
      });

      for (const item of input.items) {
        const product = productsById.get(item.productId);

        if (!product?.trackStock) {
          continue;
        }

        const updatedStock = await transaction.productStock.updateMany({
          where: {
            productId: item.productId,
            branchId: input.branchId,
            quantity: { gte: item.quantity },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        if (updatedStock.count !== 1) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}" en esta sucursal.`,
          );
        }

        const nextStock = await transaction.productStock.findUniqueOrThrow({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: input.branchId,
            },
          },
          select: { id: true, quantity: true, minQuantity: true },
        });

        await transaction.productStock.update({
          where: { id: nextStock.id },
          data: {
            status: this.resolveStockStatus(
              nextStock.quantity,
              nextStock.minQuantity,
            ),
          },
        });

        await transaction.stockMovement.create({
          data: {
            organizationId,
            branchId: input.branchId,
            productId: item.productId,
            saleId: sale.id,
            createdByUserId: userId,
            type: StockMovementType.SALE,
            quantity: new Prisma.Decimal(item.quantity).mul(-1),
            balanceAfter: nextStock.quantity,
            note: `Venta ${saleNumber}`,
          },
        });
      }

      for (const payment of input.payments) {
        if (payment.paymentMethodId) {
          const paymentMethod = await transaction.paymentMethod.findFirst({
            where: {
              id: payment.paymentMethodId,
              organizationId,
              enabled: true,
            },
            select: { id: true },
          });

          if (!paymentMethod) {
            throw new BadRequestException(
              'Uno de los metodos de pago no existe o no esta activo.',
            );
          }
        }

        if (payment.paymentIntentId) {
          const intent = await transaction.paymentIntent.findFirst({
            where: {
              id: payment.paymentIntentId,
              organizationId,
              status: PaymentIntentStatus.CONFIRMED,
              saleId: null,
            },
            select: { id: true, amount: true },
          });

          if (
            !intent ||
            !intent.amount.equals(new Prisma.Decimal(payment.amount))
          ) {
            throw new BadRequestException(
              'El intento de pago no existe, no esta confirmado o no coincide con el monto.',
            );
          }
        }

        const status = (payment.status ?? 'CONFIRMED') as SalePaymentStatus;
        const cashMovement =
          status === SalePaymentStatus.CONFIRMED
            ? await transaction.cashMovement.create({
                data: {
                  cashSessionId: input.cashSessionId,
                  paymentMethodId: payment.paymentMethodId,
                  createdByUserId: userId,
                  type: CashMovementType.INCOME,
                  amount: new Prisma.Decimal(payment.amount),
                  concept: `Venta ${saleNumber}`,
                  note: payment.providerRef
                    ? `Referencia ${payment.providerRef}`
                    : undefined,
                },
              })
            : null;

        await transaction.salePayment.create({
          data: {
            saleId: sale.id,
            paymentMethodId: payment.paymentMethodId,
            cashMovementId: cashMovement?.id,
            paymentIntentId: payment.paymentIntentId,
            status,
            amount: new Prisma.Decimal(payment.amount),
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

      if (input.customerProfileId) {
        const wallet = await transaction.loyaltyWallet.upsert({
          where: { customerProfileId: input.customerProfileId },
          create: {
            organizationId,
            customerProfileId: input.customerProfileId,
            redeemablePoints: 0,
            lifetimePoints: 0,
          },
          update: {},
        });

        let redeemablePoints = wallet.redeemablePoints;
        let lifetimePoints = wallet.lifetimePoints;

        if (loyaltyPointsToRedeem > 0) {
          redeemablePoints -= loyaltyPointsToRedeem;
          await transaction.loyaltyWallet.update({
            where: { id: wallet.id },
            data: { redeemablePoints },
          });
          await transaction.loyaltyMovement.create({
            data: {
              organizationId,
              customerProfileId: input.customerProfileId,
              saleId: sale.id,
              type: LoyaltyMovementType.REDEEM,
              points: -loyaltyPointsToRedeem,
              redeemableBalanceAfter: redeemablePoints,
              lifetimeBalanceAfter: lifetimePoints,
              reason: `Canje en venta ${saleNumber}`,
            },
          });
        }

        const earnedPoints = Math.floor(Number(total) / 5);

        if (earnedPoints > 0) {
          redeemablePoints += earnedPoints;
          lifetimePoints += earnedPoints;
          await transaction.loyaltyWallet.update({
            where: { id: wallet.id },
            data: { redeemablePoints, lifetimePoints },
          });
          await transaction.loyaltyMovement.create({
            data: {
              organizationId,
              customerProfileId: input.customerProfileId,
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

      const createdSale = await transaction.sale.findUniqueOrThrow({
        where: { id: sale.id },
        include: this.saleInclude(),
      });

      return this.serializeSale(createdSale);
    });
  }

  private billingRecipientData(
    documentType: 'BOLETA' | 'FACTURA' | 'TICKET',
    recipient?: CreateSaleDto['billingRecipient'],
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

  async cancelSale(
    organizationId: string,
    userId: string,
    saleId: string,
    input: CancelSaleDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const sale = await transaction.sale.findFirst({
        where: { id: saleId, organizationId },
        include: {
          items: true,
          payments: true,
          cashSession: { select: { id: true, status: true } },
          loyaltyMovements: true,
        },
      });

      if (!sale) {
        throw new NotFoundException('La venta no existe.');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('La venta ya fue anulada.');
      }

      if (sale.status !== SaleStatus.PAID) {
        throw new BadRequestException('Solo se pueden anular ventas pagadas.');
      }

      if (sale.cashSession.status !== CashSessionStatus.OPEN) {
        throw new BadRequestException(
          'Solo se pueden anular ventas mientras la caja sigue abierta.',
        );
      }

      for (const item of sale.items) {
        if (!item.productId) {
          continue;
        }

        const stock = await transaction.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: sale.branchId,
            },
          },
          create: {
            productId: item.productId,
            branchId: sale.branchId,
            quantity: item.quantity,
            minQuantity: new Prisma.Decimal(0),
            status: StockStatus.OK,
          },
          update: {
            quantity: { increment: item.quantity },
          },
          select: { id: true, quantity: true, minQuantity: true },
        });

        await transaction.productStock.update({
          where: { id: stock.id },
          data: {
            status: this.resolveStockStatus(stock.quantity, stock.minQuantity),
          },
        });

        await transaction.stockMovement.create({
          data: {
            organizationId,
            branchId: sale.branchId,
            productId: item.productId,
            saleId: sale.id,
            createdByUserId: userId,
            type: StockMovementType.SALE_CANCEL,
            quantity: item.quantity,
            balanceAfter: stock.quantity,
            note: input.reason ?? `Anulacion de venta ${sale.saleNumber}`,
          },
        });
      }

      for (const payment of sale.payments) {
        if (payment.status !== SalePaymentStatus.CONFIRMED) {
          continue;
        }

        await transaction.cashMovement.create({
          data: {
            cashSessionId: sale.cashSessionId,
            paymentMethodId: payment.paymentMethodId,
            createdByUserId: userId,
            type: CashMovementType.WITHDRAWAL,
            amount: payment.amount,
            concept: `Anulacion ${sale.saleNumber}`,
            note: input.reason,
          },
        });
      }

      if (sale.customerProfileId) {
        const wallet = await transaction.loyaltyWallet.findUnique({
          where: { customerProfileId: sale.customerProfileId },
        });

        if (wallet) {
          const earned = sale.loyaltyMovements
            .filter((movement) => movement.type === LoyaltyMovementType.EARN)
            .reduce((sum, movement) => sum + movement.points, 0);
          const redeemed = sale.loyaltyMovements
            .filter((movement) => movement.type === LoyaltyMovementType.REDEEM)
            .reduce((sum, movement) => sum + Math.abs(movement.points), 0);

          const redeemablePoints = Math.max(
            0,
            wallet.redeemablePoints - earned + redeemed,
          );
          const lifetimePoints = Math.max(0, wallet.lifetimePoints - earned);

          await transaction.loyaltyWallet.update({
            where: { id: wallet.id },
            data: { redeemablePoints, lifetimePoints },
          });

          await transaction.loyaltyMovement.create({
            data: {
              organizationId,
              customerProfileId: sale.customerProfileId,
              saleId: sale.id,
              type: LoyaltyMovementType.REVERSAL,
              points: redeemed - earned,
              redeemableBalanceAfter: redeemablePoints,
              lifetimeBalanceAfter: lifetimePoints,
              reason:
                input.reason ?? `Reversion por anulacion ${sale.saleNumber}`,
            },
          });
        }
      }

      await transaction.billingDocument.updateMany({
        where: { saleId: sale.id },
        data: { status: BillingDocumentStatus.CANCELLED },
      });

      await transaction.paymentIntent.updateMany({
        where: { saleId: sale.id },
        data: { status: PaymentIntentStatus.CANCELLED },
      });

      const cancelledSale = await transaction.sale.update({
        where: { id: sale.id },
        data: {
          status: SaleStatus.CANCELLED,
          billingStatus: BillingStatus.CANCELLED,
          cancelledByUserId: userId,
          cancelledAt: new Date(),
          cancelReason: input.reason,
        },
        include: this.saleInclude(),
      });

      return this.serializeSale(cancelledSale);
    });
  }

  private async createSaleNumber(
    organizationId: string,
    transaction: Prisma.TransactionClient,
  ) {
    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
      const saleNumber = `V-${stamp}-${suffix}`;
      const existingSale = await transaction.sale.findFirst({
        where: { organizationId, saleNumber },
        select: { id: true },
      });

      if (!existingSale) {
        return saleNumber;
      }
    }

    throw new BadRequestException('No se pudo generar el numero de venta.');
  }

  private saleInclude() {
    return {
      branch: { select: { id: true, name: true, code: true } },
      cashSession: { select: { id: true, openedAt: true, status: true } },
      customerProfile: {
        select: {
          id: true,
          externalCustomerCode: true,
          loyaltyTier: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              documentNumber: true,
            },
          },
          loyaltyWallet: true,
        },
      },
      createdBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      cancelledBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      items: { orderBy: { createdAt: 'asc' as const } },
      payments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          paymentMethod: {
            select: { id: true, name: true, code: true, type: true },
          },
          cashMovement: { select: { id: true, type: true, amount: true } },
          paymentIntent: {
            select: {
              id: true,
              provider: true,
              providerRef: true,
              status: true,
            },
          },
        },
      },
      billingDocuments: { orderBy: { createdAt: 'asc' as const } },
      loyaltyMovements: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  private resolveStockStatus(
    quantity: Prisma.Decimal,
    minQuantity: Prisma.Decimal,
  ) {
    if (quantity.lessThanOrEqualTo(0)) {
      return StockStatus.OUT;
    }

    if (quantity.lessThanOrEqualTo(minQuantity)) {
      return StockStatus.LOW;
    }

    return StockStatus.OK;
  }

  private serializeSale(sale: {
    subtotal: Prisma.Decimal;
    taxTotal: Prisma.Decimal;
    discountTotal: Prisma.Decimal;
    total: Prisma.Decimal;
    paidTotal: Prisma.Decimal;
    changeTotal: Prisma.Decimal;
    customerProfile?: {
      loyaltyWallet?: {
        redeemablePoints: number;
        lifetimePoints: number;
        [key: string]: unknown;
      } | null;
      [key: string]: unknown;
    } | null;
    items: Array<{
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      total: Prisma.Decimal;
      [key: string]: unknown;
    }>;
    payments: Array<{
      amount: Prisma.Decimal;
      cashMovement: { amount: Prisma.Decimal; [key: string]: unknown } | null;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }) {
    return {
      ...sale,
      subtotal: Number(sale.subtotal),
      taxTotal: Number(sale.taxTotal),
      discountTotal: Number(sale.discountTotal),
      total: Number(sale.total),
      paidTotal: Number(sale.paidTotal),
      changeTotal: Number(sale.changeTotal),
      items: sale.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        discountAmount: Number(item.discountAmount),
        total: Number(item.total),
      })),
      payments: sale.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        cashMovement: payment.cashMovement
          ? {
              ...payment.cashMovement,
              amount: Number(payment.cashMovement.amount),
            }
          : null,
      })),
    };
  }
}
