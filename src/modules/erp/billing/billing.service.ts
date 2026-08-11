import { Injectable } from '@nestjs/common';
import {
  BillingDocumentStatus,
  Prisma,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prismaService: PrismaService) {}

  async listDocuments(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: BillingDocumentStatus;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.BillingDocumentWhereInput = {
      organizationId: input.organizationId,
      status: input.status,
      ...(search
        ? {
            OR: [
              { externalId: { contains: search, mode: 'insensitive' } },
              { series: { contains: search, mode: 'insensitive' } },
              { number: { contains: search, mode: 'insensitive' } },
              { sale: { saleNumber: { contains: search, mode: 'insensitive' } } },
              {
                sale: {
                  customerProfile: {
                    user: {
                      documentNumber: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [documents, total] = await Promise.all([
      this.prismaService.billingDocument.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          sale: {
            select: {
              id: true,
              saleNumber: true,
              total: true,
              soldAt: true,
              status: true,
              customerProfile: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      documentNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.billingDocument.count({ where }),
    ]);

    return {
      data: documents.map((document) => ({
        ...document,
        sale: document.sale
          ? { ...document.sale, total: Number(document.sale.total) }
          : null,
      })),
      total,
      page,
      limit,
    };
  }
}
