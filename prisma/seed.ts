import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/database/prisma/generated/client';
import {
  obsoleteModuleKeys,
  obsoletePermissionKeys,
  permissions,
  platformModules,
  roles,
} from './kapos-catalog';

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL no esta definido.');
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({ adapter });
}

async function seedModules(prisma: PrismaClient) {
  for (const moduleItem of platformModules) {
    await prisma.platformModule.upsert({
      where: { key: moduleItem.key },
      update: {
        name: moduleItem.name,
        icon: moduleItem.icon,
        audience: moduleItem.audience,
        sortOrder: moduleItem.sortOrder,
      },
      create: {
        key: moduleItem.key,
        name: moduleItem.name,
        icon: moduleItem.icon,
        audience: moduleItem.audience,
        sortOrder: moduleItem.sortOrder,
      },
    });

    const persistedModule = await prisma.platformModule.findUniqueOrThrow({
      where: { key: moduleItem.key },
      select: { id: true },
    });

    await prisma.platformSubmodule.deleteMany({
      where: {
        moduleId: persistedModule.id,
        key: { notIn: moduleItem.submodules.map((submodule) => submodule.key) },
      },
    });

    for (const submodule of moduleItem.submodules) {
      await prisma.platformSubmodule.upsert({
        where: {
          moduleId_key: {
            moduleId: persistedModule.id,
            key: submodule.key,
          },
        },
        update: {
          name: submodule.name,
          route: submodule.route,
          permissionKey: submodule.permissionKey,
          sortOrder: submodule.sortOrder,
        },
        create: {
          moduleId: persistedModule.id,
          key: submodule.key,
          name: submodule.name,
          route: submodule.route,
          permissionKey: submodule.permissionKey,
          sortOrder: submodule.sortOrder,
        },
      });
    }
  }

  await prisma.organizationModule.deleteMany({
    where: { moduleKey: { in: obsoleteModuleKeys } },
  });
  await prisma.platformModule.deleteMany({
    where: { key: { in: obsoleteModuleKeys } },
  });
}

async function seedPermissions(prisma: PrismaClient) {
  const obsoletePermissions = await prisma.permission.findMany({
    where: { key: { in: obsoletePermissionKeys } },
    select: { id: true },
  });
  const obsoletePermissionIds = obsoletePermissions.map((permission) => permission.id);

  if (obsoletePermissionIds.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: { permissionId: { in: obsoletePermissionIds } },
    });
    await prisma.membershipPermissionOverride.deleteMany({
      where: { permissionId: { in: obsoletePermissionIds } },
    });
    await prisma.platformAccessPermissionOverride.deleteMany({
      where: { permissionId: { in: obsoletePermissionIds } },
    });
  }

  for (const permission of permissions) {
    if (obsoletePermissionKeys.includes(permission.key)) {
      continue;
    }

    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description,
        moduleKey: permission.moduleKey,
        submoduleKey: permission.submoduleKey,
        scope: permission.scope,
        audience: permission.audience,
      },
      create: permission,
    });
  }

  await prisma.permission.deleteMany({
    where: { key: { in: obsoletePermissionKeys } },
  });
}

async function seedRoles(prisma: PrismaClient) {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { scopeKey: role.scopeKey },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: {
        context: role.context,
        scopeKey: role.scopeKey,
        organizationId: null,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    const persistedRole = await prisma.role.findUniqueOrThrow({
      where: { scopeKey: role.scopeKey },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: persistedRole.id },
    });

    for (const permissionKey of role.permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
        select: { id: true },
      });

      await prisma.rolePermission.create({
        data: {
          roleId: persistedRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedLocalMasterAccess(prisma: PrismaClient) {
  const platformSuperAdminRole = await prisma.role.findUniqueOrThrow({
    where: { scopeKey: 'platform:platform.super_admin' },
    select: { id: true },
  });

  const masterPasswordHash = await hash('admin', 12);

  const masterUser = await prisma.user.upsert({
    where: { email: 'admin@kapos.local' },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      documentType: 'PASSPORT',
      documentNumber: 'ADMIN',
      passwordHash: masterPasswordHash,
      status: 'ACTIVE',
    },
    create: {
      email: 'admin@kapos.local',
      passwordHash: masterPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      documentType: 'PASSPORT',
      documentNumber: 'ADMIN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  const platformAccess = await prisma.platformAccess.upsert({
    where: { userId: masterUser.id },
    update: {
      status: 'ACTIVE',
    },
    create: {
      userId: masterUser.id,
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  await prisma.platformAccessRole.upsert({
    where: {
      platformAccessId_roleId: {
        platformAccessId: platformAccess.id,
        roleId: platformSuperAdminRole.id,
      },
    },
    update: {},
    create: {
      platformAccessId: platformAccess.id,
      roleId: platformSuperAdminRole.id,
    },
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await seedModules(prisma);
    await seedPermissions(prisma);
    await seedRoles(prisma);
    await seedLocalMasterAccess(prisma);

    console.log('Seed base de Kapos completado.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error al ejecutar el seed base de Kapos:', error);
  process.exit(1);
});
