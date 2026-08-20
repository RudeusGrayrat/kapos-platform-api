ALTER TYPE "OpenAccountEventType" ADD VALUE 'ITEM_CANCELLED';
ALTER TYPE "OpenAccountEventType" ADD VALUE 'TABLE_TRANSFERRED';
ALTER TYPE "OpenAccountEventType" ADD VALUE 'TABLE_JOINED';
ALTER TYPE "OpenAccountEventType" ADD VALUE 'TABLE_RELEASED';
ALTER TYPE "OpenAccountEventType" ADD VALUE 'PREBILL_GENERATED';

ALTER TABLE "ProductStock"
ADD COLUMN "reservedQuantity" DECIMAL(14,3) NOT NULL DEFAULT 0;

ALTER TABLE "OpenAccount"
ADD COLUMN "prebillGeneratedAt" TIMESTAMP(3);

ALTER TABLE "OpenAccountItem"
ADD COLUMN "cancelledByUserId" UUID,
ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE TABLE "OpenAccountPaymentAllocation" (
    "id" UUID NOT NULL,
    "openAccountPaymentId" UUID NOT NULL,
    "openAccountItemId" UUID NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenAccountPaymentAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpenAccountTableLink" (
    "id" UUID NOT NULL,
    "openAccountId" UUID NOT NULL,
    "diningTableId" UUID NOT NULL,
    "assignedByUserId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    CONSTRAINT "OpenAccountTableLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpenAccountPaymentAllocation_openAccountPaymentId_openAccountItemId_key"
ON "OpenAccountPaymentAllocation"("openAccountPaymentId", "openAccountItemId");
CREATE INDEX "OpenAccountPaymentAllocation_openAccountItemId_idx"
ON "OpenAccountPaymentAllocation"("openAccountItemId");
CREATE INDEX "OpenAccountTableLink_openAccountId_releasedAt_idx"
ON "OpenAccountTableLink"("openAccountId", "releasedAt");
CREATE INDEX "OpenAccountTableLink_diningTableId_releasedAt_idx"
ON "OpenAccountTableLink"("diningTableId", "releasedAt");
CREATE UNIQUE INDEX "OpenAccountTableLink_one_active_table_key"
ON "OpenAccountTableLink"("diningTableId") WHERE "releasedAt" IS NULL;

ALTER TABLE "OpenAccountItem"
ADD CONSTRAINT "OpenAccountItem_cancelledByUserId_fkey"
FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPaymentAllocation"
ADD CONSTRAINT "OpenAccountPaymentAllocation_openAccountPaymentId_fkey"
FOREIGN KEY ("openAccountPaymentId") REFERENCES "OpenAccountPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccountPaymentAllocation"
ADD CONSTRAINT "OpenAccountPaymentAllocation_openAccountItemId_fkey"
FOREIGN KEY ("openAccountItemId") REFERENCES "OpenAccountItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountTableLink"
ADD CONSTRAINT "OpenAccountTableLink_openAccountId_fkey"
FOREIGN KEY ("openAccountId") REFERENCES "OpenAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenAccountTableLink"
ADD CONSTRAINT "OpenAccountTableLink_diningTableId_fkey"
FOREIGN KEY ("diningTableId") REFERENCES "DiningTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpenAccountTableLink"
ADD CONSTRAINT "OpenAccountTableLink_assignedByUserId_fkey"
FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
