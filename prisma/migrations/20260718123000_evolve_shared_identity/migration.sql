-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'CE', 'PASSPORT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "documentType" "DocumentType",
  ADD COLUMN "documentNumber" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "documentVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ALTER COLUMN "firstName" DROP NOT NULL,
  ALTER COLUMN "lastName" DROP NOT NULL;

-- Backfill identity state from the previous model
UPDATE "User"
SET
  "status" = CASE
    WHEN "isActive" = TRUE THEN 'ACTIVE'::"UserStatus"
    ELSE 'SUSPENDED'::"UserStatus"
  END,
  "emailVerifiedAt" = CASE
    WHEN "emailVerified" = TRUE THEN "updatedAt"
    ELSE NULL
  END;

-- Backfill lastLoginAt from existing sessions
UPDATE "User" AS u
SET "lastLoginAt" = s."lastSessionAt"
FROM (
  SELECT "userId", MAX("createdAt") AS "lastSessionAt"
  FROM "Session"
  GROUP BY "userId"
) AS s
WHERE u."id" = s."userId";

-- Drop legacy columns after backfill
ALTER TABLE "User"
  DROP COLUMN "isActive",
  DROP COLUMN "emailVerified";

-- CreateTable
CREATE TABLE "OAuthAccount" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "provider" "OAuthProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_documentNumber_key" ON "User"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- AddForeignKey
ALTER TABLE "OAuthAccount"
ADD CONSTRAINT "OAuthAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
