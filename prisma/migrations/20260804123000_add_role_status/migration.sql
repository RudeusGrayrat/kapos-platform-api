-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN "status" "RoleStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropIndex
DROP INDEX "Role_context_organizationId_idx";

-- CreateIndex
CREATE INDEX "Role_context_organizationId_status_idx" ON "Role"("context", "organizationId", "status");
