CREATE TYPE "ServiceType" AS ENUM ('LOCAL', 'DELIVERY', 'TAKEAWAY');
CREATE TYPE "OpenAccountStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'CLOSED', 'CANCELLED');
CREATE TYPE "OpenAccountItemStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TYPE "KitchenTicketStatus" AS ENUM ('DRAFT', 'SENT', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "OpenAccountPaymentStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
CREATE TYPE "OpenAccountEventType" AS ENUM ('OPENED', 'ITEM_ADDED', 'KITCHEN_SENT', 'KITCHEN_STATUS_CHANGED', 'PAYMENT_RECORDED', 'CUSTOMER_ASSIGNED', 'CLOSED', 'CANCELLED');

CREATE TABLE "DiningArea" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiningArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiningTable" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "areaId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenAccount" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "diningTableId" UUID,
    "customerProfileId" UUID,
    "cashSessionId" UUID,
    "saleId" UUID,
    "createdByUserId" UUID NOT NULL,
    "closedByUserId" UUID,
    "accountNumber" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "status" "OpenAccountStatus" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "guestCount" INTEGER,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "deliveryAddress" TEXT,
    "deliveryReference" TEXT,
    "note" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpenAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KitchenTicket" (
    "id" UUID NOT NULL,
    "openAccountId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "KitchenTicketStatus" NOT NULL DEFAULT 'SENT',
    "note" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenAccountItem" (
    "id" UUID NOT NULL,
    "openAccountId" UUID NOT NULL,
    "productId" UUID,
    "kitchenTicketId" UUID,
    "createdByUserId" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "status" "OpenAccountItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpenAccountItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenAccountPayment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "openAccountId" UUID NOT NULL,
    "cashSessionId" UUID NOT NULL,
    "paymentMethodId" UUID,
    "paymentIntentId" UUID,
    "cashMovementId" UUID,
    "createdByUserId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OpenAccountPaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "amount" DECIMAL(12,2) NOT NULL,
    "provider" TEXT,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpenAccountPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenAccountEvent" (
    "id" UUID NOT NULL,
    "openAccountId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "type" "OpenAccountEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenAccountEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiningArea_organizationId_branchId_isActive_idx" ON "DiningArea"("organizationId", "branchId", "isActive");
CREATE UNIQUE INDEX "DiningArea_branchId_name_key" ON "DiningArea"("branchId", "name");
CREATE INDEX "DiningTable_organizationId_branchId_isActive_idx" ON "DiningTable"("organizationId", "branchId", "isActive");
CREATE INDEX "DiningTable_areaId_sortOrder_idx" ON "DiningTable"("areaId", "sortOrder");
CREATE UNIQUE INDEX "DiningTable_branchId_code_key" ON "DiningTable"("branchId", "code");
CREATE UNIQUE INDEX "OpenAccount_saleId_key" ON "OpenAccount"("saleId");
CREATE INDEX "OpenAccount_organizationId_branchId_status_updatedAt_idx" ON "OpenAccount"("organizationId", "branchId", "status", "updatedAt");
CREATE INDEX "OpenAccount_diningTableId_status_idx" ON "OpenAccount"("diningTableId", "status");
CREATE INDEX "OpenAccount_customerProfileId_idx" ON "OpenAccount"("customerProfileId");
CREATE INDEX "OpenAccount_cashSessionId_idx" ON "OpenAccount"("cashSessionId");
CREATE UNIQUE INDEX "OpenAccount_organizationId_accountNumber_key" ON "OpenAccount"("organizationId", "accountNumber");
CREATE UNIQUE INDEX "OpenAccount_one_active_table_key" ON "OpenAccount"("diningTableId") WHERE "diningTableId" IS NOT NULL AND "status" IN ('OPEN', 'PARTIALLY_PAID');
CREATE INDEX "OpenAccountItem_openAccountId_status_idx" ON "OpenAccountItem"("openAccountId", "status");
CREATE INDEX "OpenAccountItem_productId_idx" ON "OpenAccountItem"("productId");
CREATE INDEX "OpenAccountItem_kitchenTicketId_idx" ON "OpenAccountItem"("kitchenTicketId");
CREATE INDEX "KitchenTicket_status_sentAt_idx" ON "KitchenTicket"("status", "sentAt");
CREATE UNIQUE INDEX "KitchenTicket_openAccountId_sequence_key" ON "KitchenTicket"("openAccountId", "sequence");
CREATE UNIQUE INDEX "OpenAccountPayment_cashMovementId_key" ON "OpenAccountPayment"("cashMovementId");
CREATE INDEX "OpenAccountPayment_organizationId_branchId_createdAt_idx" ON "OpenAccountPayment"("organizationId", "branchId", "createdAt");
CREATE INDEX "OpenAccountPayment_cashSessionId_idx" ON "OpenAccountPayment"("cashSessionId");
CREATE INDEX "OpenAccountPayment_paymentIntentId_idx" ON "OpenAccountPayment"("paymentIntentId");
CREATE UNIQUE INDEX "OpenAccountPayment_openAccountId_idempotencyKey_key" ON "OpenAccountPayment"("openAccountId", "idempotencyKey");
CREATE INDEX "OpenAccountEvent_openAccountId_createdAt_idx" ON "OpenAccountEvent"("openAccountId", "createdAt");

ALTER TABLE "DiningArea" ADD CONSTRAINT "DiningArea_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiningArea" ADD CONSTRAINT "DiningArea_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "DiningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_diningTableId_fkey" FOREIGN KEY ("diningTableId") REFERENCES "DiningTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccount" ADD CONSTRAINT "OpenAccount_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_openAccountId_fkey" FOREIGN KEY ("openAccountId") REFERENCES "OpenAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountItem" ADD CONSTRAINT "OpenAccountItem_openAccountId_fkey" FOREIGN KEY ("openAccountId") REFERENCES "OpenAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccountItem" ADD CONSTRAINT "OpenAccountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccountItem" ADD CONSTRAINT "OpenAccountItem_kitchenTicketId_fkey" FOREIGN KEY ("kitchenTicketId") REFERENCES "KitchenTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccountItem" ADD CONSTRAINT "OpenAccountItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_openAccountId_fkey" FOREIGN KEY ("openAccountId") REFERENCES "OpenAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_cashMovementId_fkey" FOREIGN KEY ("cashMovementId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPayment" ADD CONSTRAINT "OpenAccountPayment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountEvent" ADD CONSTRAINT "OpenAccountEvent_openAccountId_fkey" FOREIGN KEY ("openAccountId") REFERENCES "OpenAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccountEvent" ADD CONSTRAINT "OpenAccountEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
