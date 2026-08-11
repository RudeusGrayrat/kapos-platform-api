import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CashSessionStatus,
  PaymentIntentStatus,
  Prisma,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ConfirmPaymentIntentDto } from './dto/confirm-payment-intent.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createIntent(organizationId: string, input: CreatePaymentIntentDto) {
    if (input.branchId) {
      const branch = await this.prismaService.branch.findFirst({
        where: { id: input.branchId, organizationId },
        select: { id: true },
      });

      if (!branch) {
        throw new BadRequestException('La sucursal no pertenece a la organizacion.');
      }
    }

    if (input.cashSessionId) {
      const session = await this.prismaService.cashSession.findFirst({
        where: {
          id: input.cashSessionId,
          organizationId,
          status: CashSessionStatus.OPEN,
          ...(input.branchId ? { branchId: input.branchId } : {}),
        },
        select: { id: true },
      });

      if (!session) {
        throw new BadRequestException(
          'La sesion de caja no existe o no esta abierta.',
        );
      }
    }

    if (input.paymentMethodId) {
      const paymentMethod = await this.prismaService.paymentMethod.findFirst({
        where: {
          id: input.paymentMethodId,
          organizationId,
          enabled: true,
        },
        select: { id: true },
      });

      if (!paymentMethod) {
        throw new BadRequestException(
          'El metodo de pago no existe o no esta activo.',
        );
      }
    }

    return this.prismaService.paymentIntent.create({
      data: {
        organizationId,
        branchId: input.branchId,
        cashSessionId: input.cashSessionId,
        paymentMethodId: input.paymentMethodId,
        amount: new Prisma.Decimal(input.amount),
        provider: input.provider.toUpperCase(),
        providerRef: input.providerRef,
        rawRequest: input.rawRequest as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async confirmIntent(
    organizationId: string,
    paymentIntentId: string,
    input: ConfirmPaymentIntentDto,
  ) {
    const intent = await this.ensureIntentIsEditable(
      organizationId,
      paymentIntentId,
    );

    return this.prismaService.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: PaymentIntentStatus.CONFIRMED,
        providerRef: input.providerRef ?? intent.providerRef,
        rawResponse: input.rawResponse as Prisma.InputJsonValue | undefined,
        confirmedAt: new Date(),
      },
    });
  }

  async failIntent(
    organizationId: string,
    paymentIntentId: string,
    input: ConfirmPaymentIntentDto,
  ) {
    const intent = await this.ensureIntentIsEditable(
      organizationId,
      paymentIntentId,
    );

    return this.prismaService.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: PaymentIntentStatus.FAILED,
        providerRef: input.providerRef ?? intent.providerRef,
        rawResponse: input.rawResponse as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private async ensureIntentIsEditable(
    organizationId: string,
    paymentIntentId: string,
  ) {
    const intent = await this.prismaService.paymentIntent.findFirst({
      where: { id: paymentIntentId, organizationId },
    });

    if (!intent) {
      throw new BadRequestException('El intento de pago no existe.');
    }

    if (intent.saleId) {
      throw new BadRequestException('El intento de pago ya fue usado en una venta.');
    }

    if (intent.status !== PaymentIntentStatus.PENDING) {
      throw new BadRequestException('El intento de pago ya no esta pendiente.');
    }

    return intent;
  }
}
