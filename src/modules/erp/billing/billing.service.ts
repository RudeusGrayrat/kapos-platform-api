import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import {
  BillingAuthorizationScheme,
  BillingDocumentStatus,
  BillingDocumentType,
  BillingProviderEnvironment,
  BillingStatus,
  Prisma,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  IssueBillingDocumentDto,
  UpdateBillingProviderDto,
  UpsertBillingSeriesDto,
} from './dto/billing-provider.dto';

const PROVIDER_NAME = 'NUBEFACT_PSE';
const DEFAULT_BASE_URL = '';
const REQUEST_TIMEOUT_MS = 30_000;
const billingIssueInclude = {
  sale: {
    include: {
      organization: { include: { settings: true } },
      branch: true,
      customerProfile: { include: { user: true } },
      items: { orderBy: { createdAt: 'asc' as const } },
    },
  },
} satisfies Prisma.BillingDocumentInclude;

type BillingIssueDocument = Prisma.BillingDocumentGetPayload<{
  include: typeof billingIssueInclude;
}>;
type ProviderResponse = Record<string, unknown>;

@Injectable()
export class BillingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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
              {
                sale: { saleNumber: { contains: search, mode: 'insensitive' } },
              },
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
              branch: { select: { id: true, name: true } },
              customerProfile: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      documentType: true,
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
        sale: { ...document.sale, total: Number(document.sale.total) },
      })),
      total,
      page,
      limit,
    };
  }

  async getProviderConfig(organizationId: string) {
    const config = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    return config
      ? this.serializeProviderConfig(config)
      : {
          provider: PROVIDER_NAME,
          environment: BillingProviderEnvironment.TEST,
          baseUrl: DEFAULT_BASE_URL,
          endpoint: '',
          authorizationScheme: BillingAuthorizationScheme.TOKEN,
          pdfFormat: 'TICKET',
          enabled: false,
          hasToken: false,
          configured: false,
          updatedAt: null,
        };
  }

  async createProviderConfig(
    organizationId: string,
    input: UpdateBillingProviderDto,
  ) {
    const existing = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe una conexion fiscal para esta organizacion.',
      );
    }
    return this.persistProviderConfig(organizationId, input, null);
  }

  async updateProviderConfig(
    organizationId: string,
    input: UpdateBillingProviderDto,
  ) {
    const current = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    if (!current) {
      throw new NotFoundException(
        'No hay una conexion fiscal configurada para editar.',
      );
    }
    return this.persistProviderConfig(organizationId, input, current);
  }

  async activateProviderConfig(organizationId: string) {
    const config = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    if (!config?.encryptedToken) {
      throw new BadRequestException(
        'Ingresa el token antes de activar la facturacion electronica.',
      );
    }
    return this.serializeProviderConfig(
      await this.prismaService.billingProviderConfig.update({
        where: { organizationId },
        data: { enabled: true },
      }),
    );
  }

  async deactivateProviderConfig(organizationId: string) {
    const config = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    if (!config) {
      throw new NotFoundException('No hay una conexion fiscal configurada.');
    }
    return this.serializeProviderConfig(
      await this.prismaService.billingProviderConfig.update({
        where: { organizationId },
        data: { enabled: false },
      }),
    );
  }

  async deleteProviderConfig(organizationId: string) {
    const config = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    if (!config) {
      throw new NotFoundException('No hay una conexion fiscal configurada.');
    }
    await this.prismaService.billingProviderConfig.delete({
      where: { organizationId },
    });
    return { ok: true };
  }

  private async persistProviderConfig(
    organizationId: string,
    input: UpdateBillingProviderDto,
    current: { encryptedToken: string | null } | null,
  ) {
    const token = input.token?.trim();
    if (input.enabled && !token && !current?.encryptedToken) {
      throw new BadRequestException(
        'Ingresa el token antes de activar la facturacion electronica.',
      );
    }

    const config = await this.prismaService.billingProviderConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        provider: PROVIDER_NAME,
        environment: input.environment,
        baseUrl: this.normalizeBaseUrl(input.baseUrl),
        endpoint: this.normalizeEndpoint(input.endpoint),
        encryptedToken: token ? this.encryptToken(token) : null,
        authorizationScheme: input.authorizationScheme,
        pdfFormat: input.pdfFormat,
        enabled: input.enabled,
      },
      update: {
        environment: input.environment,
        baseUrl: this.normalizeBaseUrl(input.baseUrl),
        endpoint: this.normalizeEndpoint(input.endpoint),
        ...(token ? { encryptedToken: this.encryptToken(token) } : {}),
        authorizationScheme: input.authorizationScheme,
        pdfFormat: input.pdfFormat,
        enabled: input.enabled,
      },
    });
    return this.serializeProviderConfig(config);
  }

  listSeries(organizationId: string) {
    return this.prismaService.billingSeries.findMany({
      where: { organizationId },
      orderBy: [{ branch: { name: 'asc' } }, { documentType: 'asc' }],
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
  }

  async createSeries(organizationId: string, input: UpsertBillingSeriesDto) {
    const existing = await this.prismaService.billingSeries.findUnique({
      where: {
        branchId_documentType: {
          branchId: input.branchId,
          documentType: input.documentType,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe una serie para esa sucursal y tipo de comprobante.',
      );
    }
    return this.saveSeries(organizationId, input);
  }

  async updateSeries(
    organizationId: string,
    seriesId: string,
    input: UpsertBillingSeriesDto,
  ) {
    const existing = await this.prismaService.billingSeries.findFirst({
      where: { id: seriesId, organizationId },
    });
    if (!existing) throw new NotFoundException('La serie no existe.');
    return this.saveSeries(organizationId, input, seriesId);
  }

  private async saveSeries(
    organizationId: string,
    input: UpsertBillingSeriesDto,
    seriesId?: string,
  ) {
    const branch = await this.prismaService.branch.findFirst({
      where: { id: input.branchId, organizationId },
      select: { id: true },
    });
    if (!branch) {
      throw new BadRequestException(
        'La sucursal no pertenece a la organizacion.',
      );
    }
    const series = input.series.trim().toUpperCase();
    const allowedPrefixes =
      input.documentType === BillingDocumentType.FACTURA
        ? ['F']
        : input.documentType === BillingDocumentType.BOLETA
          ? ['B']
          : ['B', 'F'];
    if (!allowedPrefixes.some((prefix) => series.startsWith(prefix))) {
      throw new BadRequestException(
        `La serie de ${input.documentType.toLowerCase()} debe comenzar con ${allowedPrefixes.join(' o ')}.`,
      );
    }

    if (seriesId) {
      return this.prismaService.billingSeries.update({
        where: { id: seriesId },
        data: {
          branchId: input.branchId,
          documentType: input.documentType,
          series,
          nextNumber: input.nextNumber,
          enabled: input.enabled,
        },
        include: { branch: { select: { id: true, name: true, code: true } } },
      });
    }

    return this.prismaService.billingSeries.create({
      data: {
        organizationId,
        branchId: input.branchId,
        documentType: input.documentType,
        series,
        nextNumber: input.nextNumber,
        enabled: input.enabled,
      },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
  }

  async deleteSeries(organizationId: string, seriesId: string) {
    const series = await this.prismaService.billingSeries.findFirst({
      where: { id: seriesId, organizationId },
    });
    if (!series) throw new NotFoundException('La serie no existe.');
    const usedDocuments = await this.prismaService.billingDocument.count({
      where: { organizationId, series: series.series },
    });
    if (usedDocuments > 0) {
      throw new BadRequestException(
        'No se puede eliminar una serie que ya tiene comprobantes asociados. Puedes desactivarla.',
      );
    }
    await this.prismaService.billingSeries.delete({ where: { id: series.id } });
    return { ok: true };
  }

  async testProvider(organizationId: string) {
    const config = await this.requireProviderCredential(organizationId);
    const series = await this.prismaService.billingSeries.findFirst({
      where: { organizationId, enabled: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!series) {
      throw new BadRequestException(
        'Configura al menos una serie activa antes de probar la conexion.',
      );
    }
    const response = await this.requestProvider(
      config,
      {
        operacion: 'consultar_comprobante',
        tipo_de_comprobante: this.providerDocumentType(series.documentType),
        serie: series.series,
        numero: Math.max(1, series.nextNumber - 1),
      },
      { allowProviderError: true },
    );
    const error = this.providerError(response);
    if (error && this.looksLikeAuthorizationError(error)) {
      throw new BadRequestException(error);
    }
    return {
      ok: true,
      remoteChecked: true,
      message: error
        ? 'Conexion autenticada. El comprobante consultado no existe, lo cual es normal en la prueba.'
        : 'Conexion con Nubefact/PSE verificada correctamente.',
    };
  }

  async issueDocument(
    organizationId: string,
    documentId: string,
    input: IssueBillingDocumentDto,
  ) {
    const document = await this.prismaService.billingDocument.findFirst({
      where: { id: documentId, organizationId },
      select: { id: true },
    });
    if (!document) throw new NotFoundException('El comprobante no existe.');
    return this.issue(organizationId, document.id, input.documentType);
  }

  async issueSaleDocument(
    organizationId: string,
    saleId: string,
    input: IssueBillingDocumentDto,
  ) {
    const sale = await this.prismaService.sale.findFirst({
      where: { id: saleId, organizationId },
      select: {
        id: true,
        billingDocuments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!sale) throw new NotFoundException('La venta no existe.');
    const reusable = sale.billingDocuments.find(
      (document) => document.status !== BillingDocumentStatus.CANCELLED,
    );
    const document =
      reusable ??
      (await this.prismaService.billingDocument.create({
        data: {
          organizationId,
          saleId,
          type: input.documentType,
          status: BillingDocumentStatus.PENDING,
        },
      }));
    return this.issue(organizationId, document.id, input.documentType);
  }

  private async issue(
    organizationId: string,
    documentId: string,
    documentType: 'BOLETA' | 'FACTURA',
  ) {
    const config = await this.requireEnabledProvider(organizationId);
    const preview = await this.prismaService.billingDocument.findFirst({
      where: { id: documentId, organizationId },
      include: billingIssueInclude,
    });
    if (!preview) throw new NotFoundException('El comprobante no existe.');
    if (preview.status === BillingDocumentStatus.BILLED) return preview;
    this.validateFiscalData(preview, documentType);

    const claimed = await this.claimDocument(
      organizationId,
      documentId,
      documentType,
    );
    try {
      if (claimed.hadAssignedNumber) {
        const consulted = await this.requestProvider(config, {
          operacion: 'consultar_comprobante',
          tipo_de_comprobante: this.providerDocumentType(claimed.document.type),
          serie: claimed.document.series,
          numero: Number(claimed.document.number),
        });
        if (this.providerHasDocument(consulted)) {
          return await this.persistProviderResult(
            claimed.document.id,
            consulted,
          );
        }
      }
      const response = await this.requestProvider(
        config,
        this.buildProviderPayload(claimed.document, config.pdfFormat),
      );
      return await this.persistProviderResult(claimed.document.id, response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo emitir el comprobante.';
      await this.prismaService.$transaction([
        this.prismaService.billingDocument.update({
          where: { id: claimed.document.id },
          data: {
            status: BillingDocumentStatus.FAILED,
            errorMessage: message.slice(0, 1000),
          },
        }),
        this.prismaService.sale.update({
          where: { id: claimed.document.saleId },
          data: { billingStatus: BillingStatus.FAILED },
        }),
      ]);
      if (error instanceof BadRequestException) throw error;
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(message);
    }
  }

  private async claimDocument(
    organizationId: string,
    documentId: string,
    documentType: 'BOLETA' | 'FACTURA',
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const current = await transaction.billingDocument.findFirst({
        where: { id: documentId, organizationId },
        include: { sale: { select: { branchId: true } } },
      });
      if (!current) throw new NotFoundException('El comprobante no existe.');
      if (current.status === BillingDocumentStatus.CANCELLED) {
        throw new BadRequestException('El comprobante esta anulado.');
      }
      if (current.status === BillingDocumentStatus.ISSUING) {
        throw new ConflictException('El comprobante ya se esta emitiendo.');
      }
      if (current.status === BillingDocumentStatus.BILLED) {
        throw new ConflictException('El comprobante ya fue emitido.');
      }
      if (current.series && current.type !== documentType) {
        throw new BadRequestException(
          'No se puede cambiar el tipo de un comprobante que ya tiene correlativo.',
        );
      }

      let series = current.series;
      let number = current.number;
      const hadAssignedNumber = Boolean(series && number);
      if (!series || !number) {
        const configured = await transaction.billingSeries.findUnique({
          where: {
            branchId_documentType: {
              branchId: current.sale.branchId,
              documentType,
            },
          },
        });
        if (!configured?.enabled) {
          throw new BadRequestException(
            `No hay una serie activa de ${documentType.toLowerCase()} para esta sucursal.`,
          );
        }
        const reserved = await transaction.billingSeries.update({
          where: { id: configured.id },
          data: { nextNumber: { increment: 1 } },
        });
        series = reserved.series;
        number = String(reserved.nextNumber - 1);
      }

      const document = await transaction.billingDocument.update({
        where: { id: current.id },
        data: {
          type: documentType,
          status: BillingDocumentStatus.ISSUING,
          provider: PROVIDER_NAME,
          series,
          number,
          errorMessage: null,
        },
        include: billingIssueInclude,
      });
      await transaction.sale.update({
        where: { id: document.saleId },
        data: { billingStatus: BillingStatus.PENDING },
      });
      return { hadAssignedNumber, document };
    });
  }

  private validateFiscalData(
    document: BillingIssueDocument,
    documentType: 'BOLETA' | 'FACTURA',
  ) {
    if (!document.sale.items.length) {
      throw new BadRequestException(
        'La venta no tiene productos para facturar.',
      );
    }
    const organization = document.sale.organization;
    if (
      organization.documentType !== 'RUC' ||
      organization.documentNumber?.length !== 11
    ) {
      throw new BadRequestException(
        'Configura el RUC de 11 digitos de la empresa antes de emitir.',
      );
    }
    if (documentType === 'FACTURA') {
      const fiscalDocumentNumber =
        document.recipientDocumentNumber ??
        document.sale.customerProfile?.user.documentNumber;
      const fiscalDocumentType =
        document.recipientDocumentType ??
        document.sale.customerProfile?.user.documentType;
      const fiscalName =
        document.recipientName ??
        [
          document.sale.customerProfile?.user.firstName,
          document.sale.customerProfile?.user.lastName,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();
      if (
        fiscalDocumentType !== 'RUC' ||
        fiscalDocumentNumber?.length !== 11 ||
        !fiscalName
      ) {
        throw new BadRequestException(
          'Para emitir factura ingresa RUC de 11 digitos y razon social.',
        );
      }
    }
  }

  private buildProviderPayload(
    document: BillingIssueDocument,
    pdfFormat: string,
  ) {
    const sale = document.sale;
    const customer = sale.customerProfile?.user;
    const grossBeforeDiscount = sale.items.reduce(
      (sum, item) => sum.plus(item.total),
      new Prisma.Decimal(0),
    );
    const saleTotal = new Prisma.Decimal(sale.total);
    const factor = grossBeforeDiscount.greaterThan(0)
      ? saleTotal.div(grossBeforeDiscount)
      : new Prisma.Decimal(1);
    let accumulatedGross = new Prisma.Decimal(0);
    let taxableBase = new Prisma.Decimal(0);
    let unaffectedTotal = new Prisma.Decimal(0);
    let totalTax = new Prisma.Decimal(0);

    const items = sale.items.map((item, index) => {
      const gross =
        index === sale.items.length - 1
          ? saleTotal.minus(accumulatedGross)
          : new Prisma.Decimal(item.total).mul(factor).toDecimalPlaces(2);
      accumulatedGross = accumulatedGross.plus(gross);
      const rate = new Prisma.Decimal(item.taxRate);
      const base = rate.greaterThan(0)
        ? gross
            .div(new Prisma.Decimal(1).plus(rate.div(100)))
            .toDecimalPlaces(2)
        : gross;
      const tax = gross.minus(base);
      if (rate.greaterThan(0)) {
        taxableBase = taxableBase.plus(base);
        totalTax = totalTax.plus(tax);
      } else {
        unaffectedTotal = unaffectedTotal.plus(gross);
      }
      return {
        unidad_de_medida: 'NIU',
        codigo: item.productSku ?? item.productId ?? item.id,
        descripcion: item.productName,
        cantidad: Number(item.quantity),
        valor_unitario: Number(base.div(item.quantity).toDecimalPlaces(6)),
        precio_unitario: Number(gross.div(item.quantity).toDecimalPlaces(6)),
        descuento: 0,
        subtotal: Number(base),
        tipo_de_igv: rate.greaterThan(0) ? 1 : 9,
        igv: Number(tax),
        total: Number(gross),
        anticipo_regularizacion: false,
      };
    });
    const customerName = customer
      ? [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
      : '';
    const recipientDocumentType =
      document.recipientDocumentType ?? customer?.documentType ?? null;
    const recipientDocumentNumber =
      document.recipientDocumentNumber ?? customer?.documentNumber ?? '-';
    const recipientName =
      document.recipientName ?? (customerName || 'CLIENTES VARIOS');

    return {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: this.providerDocumentType(document.type),
      serie: document.series,
      numero: Number(document.number),
      sunat_transaction: 1,
      cliente_tipo_de_documento: this.providerCustomerDocumentType(
        recipientDocumentType,
      ),
      cliente_numero_de_documento: recipientDocumentNumber,
      cliente_denominacion: recipientName,
      cliente_direccion: document.recipientAddress ?? '-',
      cliente_email: document.recipientEmail ?? customer?.email ?? '',
      fecha_de_emision: this.formatProviderDate(sale.soldAt),
      moneda: 1,
      tipo_de_cambio: '',
      porcentaje_de_igv: Number(sale.organization.settings?.taxRate ?? 18),
      total_gravada: Number(taxableBase.toDecimalPlaces(2)),
      total_inafecta: Number(unaffectedTotal.toDecimalPlaces(2)),
      total_exonerada: 0,
      total_gratuita: 0,
      total_igv: Number(totalTax.toDecimalPlaces(2)),
      total: Number(saleTotal.toDecimalPlaces(2)),
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: false,
      formato_de_pdf: pdfFormat,
      items,
    };
  }

  private async persistProviderResult(
    documentId: string,
    response: ProviderResponse,
  ) {
    const current = await this.prismaService.billingDocument.findUniqueOrThrow({
      where: { id: documentId },
      select: { saleId: true, series: true, number: true },
    });

    const explicitError =
      this.providerError(response) ??
      (response.aceptada_por_sunat === false
        ? this.providerSunatRejection(response)
        : null);
    const links = {
      pdfUrl: this.responseString(response, 'enlace_del_pdf'),
      xmlUrl: this.responseString(response, 'enlace_del_xml'),
      cdrUrl: this.responseString(response, 'enlace_del_cdr'),
    };

    if (explicitError) {
      await this.prismaService.$transaction([
        this.prismaService.billingDocument.update({
          where: { id: documentId },
          data: {
            status: BillingDocumentStatus.FAILED,
            externalId: `${current.series}-${current.number}`,
            ...links,
            rawResponse: response as Prisma.InputJsonValue,
            errorMessage: explicitError.slice(0, 1000),
          },
        }),
        this.prismaService.sale.update({
          where: { id: current.saleId },
          data: { billingStatus: BillingStatus.FAILED },
        }),
      ]);
      throw new BadRequestException(explicitError);
    }

    if (response.aceptada_por_sunat === false) {
      const [document] = await this.prismaService.$transaction([
        this.prismaService.billingDocument.update({
          where: { id: documentId },
          data: {
            status: BillingDocumentStatus.ISSUING,
            externalId: `${current.series}-${current.number}`,
            ...links,
            rawResponse: response as Prisma.InputJsonValue,
            errorMessage: null,
          },
        }),
        this.prismaService.sale.update({
          where: { id: current.saleId },
          data: { billingStatus: BillingStatus.PENDING },
        }),
      ]);
      return document;
    }

    const [document] = await this.prismaService.$transaction([
      this.prismaService.billingDocument.update({
        where: { id: documentId },
        data: {
          status: BillingDocumentStatus.BILLED,
          externalId: `${current.series}-${current.number}`,
          ...links,
          rawResponse: response as Prisma.InputJsonValue,
          errorMessage: null,
          issuedAt: new Date(),
        },
      }),
      this.prismaService.sale.update({
        where: { id: current.saleId },
        data: { billingStatus: BillingStatus.BILLED },
      }),
    ]);
    return document;
  }

  private async requestProvider(
    config: Awaited<ReturnType<BillingService['requireEnabledProvider']>>,
    payload: Record<string, unknown>,
    options?: { allowProviderError?: boolean },
  ): Promise<ProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(
        this.providerUrl(config.baseUrl, config.endpoint),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authorizationHeader(
              config.authorizationScheme,
              this.decryptToken(config.encryptedToken!),
            ),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );
      const text = await response.text();
      let body: ProviderResponse;
      try {
        body = text ? (JSON.parse(text) as ProviderResponse) : {};
      } catch {
        throw new ServiceUnavailableException(
          'Nubefact/PSE devolvio una respuesta no valida.',
        );
      }
      if (!response.ok && !options?.allowProviderError) {
        throw new ServiceUnavailableException(
          this.providerError(body) ??
            `Nubefact/PSE respondio HTTP ${response.status}.`,
        );
      }
      return body;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'Nubefact/PSE no respondio dentro de 30 segundos.',
        );
      }
      throw new ServiceUnavailableException(
        'No se pudo conectar con Nubefact/PSE.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requireEnabledProvider(organizationId: string) {
    const config = await this.requireProviderCredential(organizationId);
    if (!config.enabled) {
      throw new BadRequestException(
        'La integracion Nubefact/PSE esta desactivada.',
      );
    }
    return config;
  }

  private async requireProviderCredential(organizationId: string) {
    const config = await this.prismaService.billingProviderConfig.findUnique({
      where: { organizationId },
    });
    if (!config?.encryptedToken) {
      throw new BadRequestException(
        'La integracion Nubefact/PSE no esta configurada.',
      );
    }
    return config;
  }

  private serializeProviderConfig(config: {
    provider: string;
    environment: BillingProviderEnvironment;
    baseUrl: string;
    endpoint: string;
    encryptedToken: string | null;
    authorizationScheme: BillingAuthorizationScheme;
    pdfFormat: string;
    enabled: boolean;
    updatedAt: Date;
  }) {
    return {
      provider: config.provider,
      environment: config.environment,
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      authorizationScheme: config.authorizationScheme,
      pdfFormat: config.pdfFormat,
      enabled: config.enabled,
      hasToken: Boolean(config.encryptedToken),
      configured: true,
      updatedAt: config.updatedAt,
    };
  }

  private providerDocumentType(type: BillingDocumentType) {
    if (type === BillingDocumentType.FACTURA) return 1;
    if (type === BillingDocumentType.BOLETA) return 2;
    if (type === BillingDocumentType.NOTA_CREDITO) return 3;
    if (type === BillingDocumentType.NOTA_DEBITO) return 4;
    throw new BadRequestException('Solo se pueden emitir boletas o facturas.');
  }

  private providerCustomerDocumentType(type: string | null) {
    if (type === 'DNI') return 1;
    if (type === 'RUC') return 6;
    if (type === 'CE') return 4;
    if (type === 'PASSPORT') return 7;
    return '-';
  }

  private providerError(response: ProviderResponse) {
    const candidate = response.errors ?? response.error;
    if (typeof candidate === 'string' && candidate.trim())
      return candidate.trim();
    if (candidate && typeof candidate === 'object')
      return JSON.stringify(candidate);
    const code = response.codigo;
    if (typeof code === 'number' && code !== 0) {
      return (
        this.responseString(response, 'mensaje') ??
        `Error ${code} del proveedor.`
      );
    }
    return null;
  }

  private providerSunatRejection(response: ProviderResponse) {
    return (
      this.responseString(response, 'sunat_soap_error') ??
      this.responseString(response, 'sunat_description') ??
      this.responseString(response, 'sunat_note') ??
      this.responseString(response, 'sunat_responsecode')
    );
  }

  private providerHasDocument(response: ProviderResponse) {
    return (
      response.aceptada_por_sunat !== undefined ||
      Boolean(this.responseString(response, 'enlace_del_pdf')) ||
      Boolean(this.responseString(response, 'enlace_del_xml'))
    );
  }

  private looksLikeAuthorizationError(message: string) {
    return /token|autori[sz]|credencial|unauthorized|forbidden/i.test(message);
  }

  private responseString(response: ProviderResponse, key: string) {
    const value = response[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private providerUrl(baseUrl: string, endpoint: string) {
    return `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  }

  private normalizeBaseUrl(value: string) {
    return value.trim().replace(/\/+$/, '');
  }

  private normalizeEndpoint(value: string) {
    const endpoint = value.trim();
    if (!endpoint || /^https?:\/\//i.test(endpoint)) {
      throw new BadRequestException(
        'El endpoint debe ser una ruta relativa, por ejemplo /api/v1/identificador.',
      );
    }
    return `/${endpoint.replace(/^\/+/, '')}`;
  }

  private authorizationHeader(
    scheme: BillingAuthorizationScheme,
    token: string,
  ) {
    if (scheme === BillingAuthorizationScheme.RAW) return token;
    if (scheme === BillingAuthorizationScheme.TOKEN)
      return `Token token="${token}"`;
    return `Bearer ${token}`;
  }

  private encryptionKey() {
    const secret =
      this.configService.get<string>('NUBEFACT_TOKEN_ENCRYPTION_KEY')?.trim() ||
      this.configService
        .get<string>('BILLING_ENCRYPTION_KEY_NUBEFACT')
        ?.trim() ||
      this.configService.get<string>('BILLING_ENCRYPTION_KEY')?.trim() ||
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    return createHash('sha256').update(secret).digest();
  }

  private encryptToken(token: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  private decryptToken(value: string) {
    const [version, iv, authTag, encrypted] = value.split('.');
    if (version !== 'v1' || !iv || !authTag || !encrypted) {
      throw new ServiceUnavailableException(
        'El token de facturacion almacenado no se puede descifrar.',
      );
    }
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(iv, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(authTag, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new ServiceUnavailableException(
        'El token de facturacion almacenado no se puede descifrar.',
      );
    }
  }

  private formatProviderDate(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.day}-${values.month}-${values.year}`;
  }
}
