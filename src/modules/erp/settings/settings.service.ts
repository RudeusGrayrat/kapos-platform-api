import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BranchStatus,
  PaymentMethodType,
  Prisma,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrganizationProfile(organizationId: string) {
    const organization = await this.prismaService.organization.findUnique({
      where: { id: organizationId },
      include: {
        settings: true,
        branches: { orderBy: [{ createdAt: 'asc' }] },
        paymentMethods: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
      },
    });

    if (!organization) {
      throw new NotFoundException('No se encontro la organizacion activa.');
    }

    const settings =
      organization.settings ??
      (await this.prismaService.organizationSetting.create({
        data: { organizationId },
      }));

    return {
      id: organization.id,
      slug: organization.slug,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      documentNumber: organization.documentNumber,
      email: organization.email,
      phone: organization.phone,
      status: organization.status,
      settings: this.serializeSettings(settings),
      branches: organization.branches,
      paymentMethods: organization.paymentMethods,
    };
  }

  async updateOrganizationProfile(
    organizationId: string,
    input: UpdateOrganizationProfileDto,
  ) {
    await this.prismaService.organization.update({
      where: { id: organizationId },
      data: {
        legalName: input.legalName,
        tradeName: input.tradeName,
        documentNumber: input.documentNumber,
        email: input.email,
        phone: input.phone,
      },
    });

    await this.prismaService.organizationSetting.upsert({
      where: { organizationId },
      update: {
        currencyCode: input.currencyCode,
        timezone: input.timezone,
        taxRate:
          input.taxRate === undefined
            ? undefined
            : new Prisma.Decimal(input.taxRate),
        receiptFooter: input.receiptFooter,
        logoUrl: input.logoUrl,
      },
      create: {
        organizationId,
        currencyCode: input.currencyCode ?? 'PEN',
        timezone: input.timezone ?? 'America/Lima',
        taxRate:
          input.taxRate === undefined
            ? new Prisma.Decimal(18)
            : new Prisma.Decimal(input.taxRate),
        receiptFooter: input.receiptFooter,
        logoUrl: input.logoUrl,
      },
    });

    return this.getOrganizationProfile(organizationId);
  }

  listBranches(organizationId: string) {
    return this.prismaService.branch.findMany({
      where: { organizationId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  createBranch(organizationId: string, input: CreateBranchDto) {
    return this.prismaService.branch.create({
      data: {
        organizationId,
        code: input.code,
        name: input.name,
        address: input.address,
        phone: input.phone,
      },
    });
  }

  updateBranch(
    organizationId: string,
    branchId: string,
    input: UpdateBranchDto,
  ) {
    return this.prismaService.branch.update({
      where: { id: branchId, organizationId },
      data: {
        code: input.code,
        name: input.name,
        address: input.address,
        phone: input.phone,
        status: input.status,
      },
    });
  }

  listPaymentMethods(organizationId: string) {
    return this.prismaService.paymentMethod.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  createPaymentMethod(organizationId: string, input: CreatePaymentMethodDto) {
    return this.prismaService.paymentMethod.create({
      data: {
        organizationId,
        code: input.code.toLowerCase(),
        name: input.name,
        type: input.type,
        enabled: input.enabled ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  updatePaymentMethod(
    organizationId: string,
    paymentMethodId: string,
    input: UpdatePaymentMethodDto,
  ) {
    return this.prismaService.paymentMethod.update({
      where: { id: paymentMethodId, organizationId },
      data: {
        code: input.code?.toLowerCase(),
        name: input.name,
        type: input.type,
        enabled: input.enabled,
        sortOrder: input.sortOrder,
      },
    });
  }

  async deletePaymentMethod(organizationId: string, paymentMethodId: string) {
    const paymentMethod = await this.prismaService.paymentMethod.findFirst({
      where: { id: paymentMethodId, organizationId },
      select: {
        id: true,
        _count: {
          select: {
            cashMovements: true,
            salePayments: true,
            paymentIntents: true,
            openAccountPayments: true,
          },
        },
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException('El metodo de pago no existe.');
    }

    const usageCount =
      paymentMethod._count.cashMovements +
      paymentMethod._count.salePayments +
      paymentMethod._count.paymentIntents +
      paymentMethod._count.openAccountPayments;

    if (usageCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un metodo de pago con operaciones asociadas. Puedes desactivarlo.',
      );
    }

    await this.prismaService.paymentMethod.delete({
      where: { id: paymentMethod.id },
    });

    return { ok: true };
  }

  private serializeSettings(settings: {
    id: string;
    currencyCode: string;
    timezone: string;
    taxRate: Prisma.Decimal;
    receiptFooter: string | null;
    logoUrl: string | null;
  }) {
    return {
      ...settings,
      taxRate: Number(settings.taxRate),
    };
  }
}
