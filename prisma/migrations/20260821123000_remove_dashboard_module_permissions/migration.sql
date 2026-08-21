DELETE FROM "RolePermission"
WHERE "permissionId" IN (
  SELECT id FROM "Permission" WHERE key = 'dashboard.read'
);

DELETE FROM "MembershipPermissionOverride"
WHERE "permissionId" IN (
  SELECT id FROM "Permission" WHERE key = 'dashboard.read'
);

DELETE FROM "PlatformAccessPermissionOverride"
WHERE "permissionId" IN (
  SELECT id FROM "Permission" WHERE key = 'dashboard.read'
);

DELETE FROM "Permission"
WHERE key = 'dashboard.read';

DELETE FROM "OrganizationModule"
WHERE "moduleKey" = 'dashboard';

DELETE FROM "PlatformSubmodule"
WHERE "moduleId" IN (
  SELECT id FROM "PlatformModule" WHERE key = 'dashboard'
);

DELETE FROM "PlatformModule"
WHERE key = 'dashboard';
