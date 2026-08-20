/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-base-to-string */
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { BillingService } from './billing.service';

function createBillingHarness() {
  let providerConfig: Record<string, unknown> | null = null;
  let nextNumber = 1;
  let transactionQueue: Promise<unknown> = Promise.resolve();
  const documents = new Map<string, Record<string, any>>();
  const sales = new Map<string, Record<string, any>>();

  const billingDocument = {
    findFirst: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        documents.get(where.id) ?? null,
    ),
    findUniqueOrThrow: jest.fn(async ({ where }: { where: { id: string } }) => {
      const document = documents.get(where.id);
      if (!document) throw new Error('Document not found');
      return document;
    }),
    create: jest.fn(),
    update: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const document = documents.get(where.id);
        if (!document) throw new Error('Document not found');
        Object.assign(document, data);
        return document;
      },
    ),
  };
  const sale = {
    findFirst: jest.fn(async ({ where }: { where: { id: string } }) => {
      const current = sales.get(where.id);
      if (!current) return null;
      return {
        id: current.id,
        billingDocuments: Array.from(documents.values()).filter(
          (document) => document.saleId === current.id,
        ),
      };
    }),
    update: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const current = sales.get(where.id);
        if (current) Object.assign(current, data);
        return current;
      },
    ),
  };
  const transactionClient = {
    billingDocument,
    sale,
    billingSeries: {
      findUnique: jest.fn(async () => ({
        id: 'series-id',
        organizationId: 'org-id',
        branchId: 'branch-id',
        documentType: 'BOLETA',
        series: 'B001',
        nextNumber,
        enabled: true,
      })),
      update: jest.fn(async () => {
        nextNumber += 1;
        return {
          id: 'series-id',
          series: 'B001',
          nextNumber,
          enabled: true,
        };
      }),
    },
  };
  const prismaService = {
    billingProviderConfig: {
      findUnique: jest.fn(async () => providerConfig),
      upsert: jest.fn(
        async (input: {
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          providerConfig = {
            ...(providerConfig ?? input.create),
            ...(providerConfig ? input.update : {}),
            provider: 'NUBEFACT_PSE',
            updatedAt: new Date(),
          };
          return providerConfig;
        },
      ),
    },
    billingSeries: {
      findFirst: jest.fn(async () => ({
        documentType: 'BOLETA',
        series: 'B001',
        nextNumber,
        enabled: true,
      })),
    },
    billingDocument,
    sale,
    $transaction: jest.fn((input: unknown) => {
      if (Array.isArray(input)) return Promise.all(input);
      const callback = input as (
        client: typeof transactionClient,
      ) => Promise<unknown>;
      const run = transactionQueue.then(() => callback(transactionClient));
      transactionQueue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    }),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'NUBEFACT_TOKEN_ENCRYPTION_KEY' ? 'billing-test-key' : undefined,
    ),
    getOrThrow: jest.fn(() => 'jwt-test-key'),
  };
  const service = new BillingService(
    prismaService as unknown as PrismaService,
    configService as unknown as ConfigService,
  );

  function addSale(id: string) {
    const saleRecord = {
      id,
      branchId: 'branch-id',
      saleNumber: `V-${id}`,
      soldAt: new Date('2026-08-18T15:00:00.000Z'),
      total: new Prisma.Decimal(11.8),
      billingStatus: 'PENDING',
      customerProfile: null,
      organization: {
        documentType: 'RUC',
        documentNumber: '20123456789',
        settings: { taxRate: new Prisma.Decimal(18) },
      },
      branch: { id: 'branch-id', name: 'Principal' },
      items: [
        {
          id: `item-${id}`,
          productId: `product-${id}`,
          productSku: `SKU-${id}`,
          productName: 'Producto de prueba',
          quantity: new Prisma.Decimal(1),
          taxRate: new Prisma.Decimal(18),
          total: new Prisma.Decimal(11.8),
          createdAt: new Date(),
        },
      ],
    };
    const document = {
      id: `document-${id}`,
      organizationId: 'org-id',
      saleId: id,
      type: 'TICKET',
      status: 'PENDING',
      provider: null,
      series: null,
      number: null,
      pdfUrl: null,
      xmlUrl: null,
      cdrUrl: null,
      errorMessage: null,
      rawResponse: null,
      issuedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sale: saleRecord,
    };
    sales.set(id, saleRecord);
    documents.set(document.id, document);
    return document;
  }

  return {
    service,
    prismaService,
    addSale,
    getProviderConfig: () => providerConfig,
    getNextNumber: () => nextNumber,
  };
}

describe('BillingService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cifra el token y usa el esquema de autorizacion configurado', async () => {
    const harness = createBillingHarness();
    await harness.service.createProviderConfig('org-id', {
      environment: 'TEST',
      baseUrl: 'https://api.pse.pe',
      endpoint: '/api/v1/test-route',
      token: 'secret-provider-token',
      authorizationScheme: 'BEARER',
      pdfFormat: 'TICKET',
      enabled: true,
    });

    const stored = harness.getProviderConfig();
    expect(stored?.encryptedToken).not.toBe('secret-provider-token');
    expect(String(stored?.encryptedToken)).toMatch(/^v1\./);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ errors: 'El comprobante consultado no existe.' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const result = await harness.service.testProvider('org-id');

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.pse.pe/api/v1/test-route',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-provider-token',
        }),
      }),
    );
  });

  it('considera valida la conexion cuando el proveedor autentica pero no encuentra el comprobante consultado', async () => {
    const harness = createBillingHarness();
    await harness.service.createProviderConfig('org-id', {
      environment: 'TEST',
      baseUrl: 'https://api.pse.pe',
      endpoint: '/api/v1/test-route',
      token: 'secret-provider-token',
      authorizationScheme: 'TOKEN',
      pdfFormat: 'TICKET',
      enabled: true,
    });

    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: 'Documento no existe' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await harness.service.testProvider('org-id');

    expect(result).toEqual({
      ok: true,
      remoteChecked: true,
      message:
        'Conexion autenticada. El comprobante consultado no existe, lo cual es normal en la prueba.',
    });
  });

  it('reserva correlativos distintos para dos emisiones concurrentes', async () => {
    const harness = createBillingHarness();
    await harness.service.createProviderConfig('org-id', {
      environment: 'TEST',
      baseUrl: 'https://api.pse.pe',
      endpoint: '/api/v1/test-route',
      token: 'secret-provider-token',
      authorizationScheme: 'BEARER',
      pdfFormat: 'TICKET',
      enabled: true,
    });
    const first = harness.addSale('sale-1');
    const second = harness.addSale('sale-2');
    jest.spyOn(global, 'fetch').mockImplementation(async (_url, init) => {
      const payload = JSON.parse(String(init?.body)) as {
        serie: string;
        numero: number;
      };
      return new Response(
        JSON.stringify({
          aceptada_por_sunat: true,
          enlace_del_pdf: `https://provider.test/${payload.serie}-${payload.numero}.pdf`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const [firstResult, secondResult] = await Promise.all([
      harness.service.issueSaleDocument('org-id', 'sale-1', {
        documentType: 'BOLETA',
      }),
      harness.service.issueSaleDocument('org-id', 'sale-2', {
        documentType: 'BOLETA',
      }),
    ]);

    expect(new Set([firstResult.number, secondResult.number])).toEqual(
      new Set(['1', '2']),
    );
    expect(first.status).toBe('BILLED');
    expect(second.status).toBe('BILLED');
    expect(harness.getNextNumber()).toBe(3);
  });
});
