ALTER TABLE "BillingDocument"
  ADD COLUMN "recipientDocumentType" TEXT,
  ADD COLUMN "recipientDocumentNumber" TEXT,
  ADD COLUMN "recipientName" TEXT,
  ADD COLUMN "recipientAddress" TEXT,
  ADD COLUMN "recipientEmail" TEXT;
