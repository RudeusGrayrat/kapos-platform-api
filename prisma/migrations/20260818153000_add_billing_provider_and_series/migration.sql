CREATE TYPE "BillingProviderEnvironment" AS ENUM ('TEST', 'PRODUCTION');
CREATE TYPE "BillingAuthorizationScheme" AS ENUM ('BEARER', 'RAW', 'TOKEN');
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'RUC';
ALTER TYPE "BillingDocumentStatus" ADD VALUE IF NOT EXISTS 'ISSUING';

CREATE TABLE "BillingProviderConfig" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'NUBEFACT_PSE',
    "environment" "BillingProviderEnvironment" NOT NULL DEFAULT 'TEST',
    "baseUrl" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "encryptedToken" TEXT,
    "authorizationScheme" "BillingAuthorizationScheme" NOT NULL DEFAULT 'BEARER',
    "pdfFormat" TEXT NOT NULL DEFAULT 'TICKET',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingSeries" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "documentType" "BillingDocumentType" NOT NULL,
    "series" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingProviderConfig_organizationId_key" ON "BillingProviderConfig"("organizationId");
CREATE INDEX "BillingProviderConfig_provider_enabled_idx" ON "BillingProviderConfig"("provider", "enabled");
CREATE UNIQUE INDEX "BillingSeries_branchId_documentType_key" ON "BillingSeries"("branchId", "documentType");
CREATE UNIQUE INDEX "BillingSeries_organizationId_series_key" ON "BillingSeries"("organizationId", "series");
CREATE INDEX "BillingSeries_organizationId_enabled_idx" ON "BillingSeries"("organizationId", "enabled");
CREATE UNIQUE INDEX "BillingDocument_organizationId_series_number_key" ON "BillingDocument"("organizationId", "series", "number");

ALTER TABLE "BillingProviderConfig" ADD CONSTRAINT "BillingProviderConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSeries" ADD CONSTRAINT "BillingSeries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSeries" ADD CONSTRAINT "BillingSeries_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
