import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CustomerProfileStatus,
  DocumentType,
  Prisma,
  UserStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prismaService: PrismaService) {}

  async listCustomers(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.CustomerProfileWhereInput = {
      organizationId: input.organizationId,
      ...(search
        ? {
            OR: [
              {
                externalCustomerCode: { contains: search, mode: 'insensitive' },
              },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              {
                user: { firstName: { contains: search, mode: 'insensitive' } },
              },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              {
                user: {
                  documentNumber: { contains: search, mode: 'insensitive' },
                },
              },
              { user: { phone: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prismaService.customerProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: this.customerInclude(),
      }),
      this.prismaService.customerProfile.count({ where }),
    ]);

    return {
      data: customers.map((customer) => this.serializeCustomer(customer)),
      total,
      page,
      limit,
    };
  }

  async upsertCustomer(organizationId: string, input: UpsertCustomerDto) {
    if (!input.email && !input.documentNumber && !input.phone) {
      throw new BadRequestException(
        'Debes enviar al menos correo, documento o telefono del cliente.',
      );
    }

    return this.prismaService.$transaction(async (transaction) => {
      const user = await this.findOrCreateCustomerUser(transaction, input);

      const customerProfile = await transaction.customerProfile.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
        create: {
          userId: user.id,
          organizationId,
          externalCustomerCode: input.externalCustomerCode,
          status: CustomerProfileStatus.ACTIVE,
          loyaltyWallet: {
            create: {
              organizationId,
              redeemablePoints: 0,
              lifetimePoints: 0,
            },
          },
        },
        update: {
          externalCustomerCode: input.externalCustomerCode,
          status: CustomerProfileStatus.ACTIVE,
        },
        include: this.customerInclude(),
      });

      return this.serializeCustomer(customerProfile);
    });
  }

  async getCustomerWallet(organizationId: string, customerProfileId: string) {
    const customer = await this.prismaService.customerProfile.findFirst({
      where: { id: customerProfileId, organizationId },
      include: {
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
        loyaltyMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      throw new BadRequestException(
        'El cliente no pertenece a la organizacion.',
      );
    }

    return this.serializeCustomer(customer);
  }

  private async findOrCreateCustomerUser(
    transaction: Prisma.TransactionClient,
    input: UpsertCustomerDto,
  ) {
    const existingUser = await transaction.user.findFirst({
      where: {
        OR: [
          ...(input.documentNumber
            ? [{ documentNumber: input.documentNumber.trim() }]
            : []),
          ...(input.email ? [{ email: input.email.trim().toLowerCase() }] : []),
          ...(input.phone ? [{ phone: input.phone.trim() }] : []),
        ],
      },
    });

    if (existingUser) {
      return transaction.user.update({
        where: { id: existingUser.id },
        data: {
          email: input.email?.trim().toLowerCase() ?? existingUser.email,
          documentType: input.documentType ?? existingUser.documentType,
          documentNumber:
            input.documentNumber?.trim() ?? existingUser.documentNumber,
          firstName: input.firstName?.trim() ?? existingUser.firstName,
          lastName: input.lastName?.trim() ?? existingUser.lastName,
          phone: input.phone?.trim() ?? existingUser.phone,
          status: UserStatus.ACTIVE,
        },
      });
    }

    return transaction.user.create({
      data: {
        email: input.email?.trim().toLowerCase(),
        documentType: input.documentType,
        documentNumber: input.documentNumber?.trim(),
        firstName: input.firstName?.trim(),
        lastName: input.lastName?.trim(),
        phone: input.phone?.trim(),
        status: UserStatus.ACTIVE,
      },
    });
  }

  private customerInclude() {
    return {
      user: {
        select: {
          id: true,
          email: true,
          documentType: true,
          documentNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
        },
      },
      loyaltyWallet: true,
    };
  }

  private serializeCustomer(customer: {
    loyaltyWallet?: {
      redeemablePoints: number;
      lifetimePoints: number;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  }) {
    return customer;
  }
}
