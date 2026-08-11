-- CreateEnum
CREATE TYPE "PermissionOverrideEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateTable
CREATE TABLE "MembershipPermissionOverride" (
    "id" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "effect" "PermissionOverrideEffect" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAccessPermissionOverride" (
    "id" UUID NOT NULL,
    "platformAccessId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "effect" "PermissionOverrideEffect" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccessPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipPermissionOverride_permissionId_idx" ON "MembershipPermissionOverride"("permissionId");

-- CreateIndex
CREATE INDEX "MembershipPermissionOverride_membershipId_effect_idx" ON "MembershipPermissionOverride"("membershipId", "effect");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPermissionOverride_membershipId_permissionId_key" ON "MembershipPermissionOverride"("membershipId", "permissionId");

-- CreateIndex
CREATE INDEX "PlatformAccessPermissionOverride_permissionId_idx" ON "PlatformAccessPermissionOverride"("permissionId");

-- CreateIndex
CREATE INDEX "PlatformAccessPermissionOverride_platformAccessId_effect_idx" ON "PlatformAccessPermissionOverride"("platformAccessId", "effect");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccessPermissionOverride_platformAccessId_permissionId_key" ON "PlatformAccessPermissionOverride"("platformAccessId", "permissionId");

-- AddForeignKey
ALTER TABLE "MembershipPermissionOverride" ADD CONSTRAINT "MembershipPermissionOverride_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPermissionOverride" ADD CONSTRAINT "MembershipPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAccessPermissionOverride" ADD CONSTRAINT "PlatformAccessPermissionOverride_platformAccessId_fkey" FOREIGN KEY ("platformAccessId") REFERENCES "PlatformAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAccessPermissionOverride" ADD CONSTRAINT "PlatformAccessPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
