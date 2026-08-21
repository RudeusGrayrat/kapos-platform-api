import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import {
  DocumentType,
  MembershipStatus,
  ModuleAudience,
  OrganizationStatus,
  PermissionOverrideEffect,
  PlatformAccessStatus,
  Prisma,
  RoleContext,
  UserStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AssignPlatformMembershipDto } from './dto/assign-platform-membership.dto';
import { CreateOrganizationRoleDto } from './dto/create-organization-role.dto';
import { CreatePlatformModuleDto } from './dto/create-platform-module.dto';
import { CreatePlatformOrganizationDto } from './dto/create-platform-organization.dto';
import { CreatePlatformPermissionDto } from './dto/create-platform-permission.dto';
import { CreatePlatformSubmoduleDto } from './dto/create-platform-submodule.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { UpdatePlatformModuleDto } from './dto/update-platform-module.dto';
import { UpdatePlatformOrganizationDto } from './dto/update-platform-organization.dto';
import { UpdatePlatformPermissionDto } from './dto/update-platform-permission.dto';
import { UpdatePlatformRoleDto } from './dto/update-platform-role.dto';
import { UpdatePlatformSubmoduleDto } from './dto/update-platform-submodule.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { UpdatePermissionOverridesDto } from './dto/update-permission-overrides.dto';

@Injectable()
export class PlatformAdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async listOrganizations() {
    const organizations = await this.prismaService.organization.findMany({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        legalName: true,
        tradeName: true,
        slug: true,
        documentNumber: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        modules: {
          where: { enabled: true },
          select: { id: true, moduleKey: true },
        },
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          select: {
            id: true,
            userId: true,
            roleAssignments: {
              select: {
                role: {
                  select: {
                    key: true,
                  },
                },
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                documentNumber: true,
              },
            },
          },
        },
      },
    });

    return organizations.map((organization) => {
      const ownerMembership = organization.memberships.find((membership) =>
        membership.roleAssignments.some(
          (assignment) => assignment.role.key === 'organization.owner',
        ),
      );

      return {
        id: organization.id,
        legalName: organization.legalName,
        tradeName: organization.tradeName,
        slug: organization.slug,
        documentNumber: organization.documentNumber,
        email: organization.email,
        phone: organization.phone,
        status: organization.status,
        activeModules: organization.modules.length,
        moduleKeys: organization.modules.map(
          (moduleItem) => moduleItem.moduleKey,
        ),
        activeWorkers: organization.memberships.length,
        ownerUserId: ownerMembership?.userId ?? null,
        ownerName: this.getUserDisplayName(ownerMembership?.user ?? null),
        createdAt: organization.createdAt,
      };
    });
  }

  async listGlobalUsers(input?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, input?.page ?? 1);
    const limit = Math.min(100, Math.max(5, input?.limit ?? 10));
    const search = input?.search?.trim();
    const organizationLeaderRoleKeys = [
      'organization.owner',
      'organization.admin',
    ];
    const linkedMembershipWhere: Prisma.MembershipWhereInput = {
      status: {
        not: MembershipStatus.TERMINATED,
      },
    };
    const organizationLeaderMembershipWhere: Prisma.MembershipWhereInput = {
      ...linkedMembershipWhere,
      roleAssignments: {
        some: {
          role: {
            key: {
              in: organizationLeaderRoleKeys,
            },
          },
        },
      },
    };
    const where: Prisma.UserWhereInput = {
      AND: [
        {
          OR: [
            { platformAccess: { isNot: null } },
            { memberships: { some: organizationLeaderMembershipWhere } },
          ],
        },
        search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { documentNumber: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                {
                  memberships: {
                    some: {
                      ...organizationLeaderMembershipWhere,
                      organization: {
                        OR: [
                          {
                            legalName: {
                              contains: search,
                              mode: 'insensitive',
                            },
                          },
                          {
                            tradeName: {
                              contains: search,
                              mode: 'insensitive',
                            },
                          },
                          { slug: { contains: search, mode: 'insensitive' } },
                        ],
                      },
                    },
                  },
                },
              ],
            }
          : {},
      ],
    };

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          documentType: true,
          documentNumber: true,
          phone: true,
          status: true,
          platformAccess: {
            select: {
              id: true,
              status: true,
              permissionOverrides: {
                select: {
                  effect: true,
                  permission: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
              roleAssignments: {
                select: {
                  role: {
                    select: {
                      scopeKey: true,
                      key: true,
                      name: true,
                      permissions: {
                        select: {
                          permission: {
                            select: {
                              key: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          memberships: {
            where: linkedMembershipWhere,
            select: {
              id: true,
              status: true,
              title: true,
              employeeCode: true,
              permissionOverrides: {
                select: {
                  effect: true,
                  permission: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
              organization: {
                select: {
                  id: true,
                  legalName: true,
                  tradeName: true,
                  slug: true,
                  modules: {
                    where: { enabled: true },
                    select: {
                      moduleKey: true,
                    },
                  },
                },
              },
              roleAssignments: {
                select: {
                  role: {
                    select: {
                      key: true,
                      scopeKey: true,
                      name: true,
                      permissions: {
                        select: {
                          permission: {
                            select: {
                              key: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    const data = users.map((user) => {
      const scope = this.resolveUserScope(user);
      const platformRolePermissionKeys =
        user.platformAccess?.roleAssignments.flatMap((assignment) =>
          assignment.role.permissions.map(
            (rolePermission) => rolePermission.permission.key,
          ),
        ) ?? [];
      const platformOverrideGroups = this.groupPermissionOverrides(
        user.platformAccess?.permissionOverrides ?? [],
      );
      const platformPermissionKeys = this.applyPermissionOverrides(
        platformRolePermissionKeys,
        user.platformAccess?.permissionOverrides ?? [],
      );
      const memberships = user.memberships.map((membership) => {
        const rolePermissionKeys = membership.roleAssignments.flatMap(
          (assignment) =>
            assignment.role.permissions.map(
              (rolePermission) => rolePermission.permission.key,
            ),
        );
        const overrideGroups = this.groupPermissionOverrides(
          membership.permissionOverrides,
        );
        const permissionKeys =
          membership.status === MembershipStatus.ACTIVE
            ? this.applyPermissionOverrides(
                rolePermissionKeys,
                membership.permissionOverrides,
              )
            : [];

        return {
          id: membership.id,
          organizationId: membership.organization.id,
          organizationSlug: membership.organization.slug,
          organizationName:
            membership.organization.tradeName ??
            membership.organization.legalName,
          organizationModuleKeys: membership.organization.modules.map(
            (moduleItem) => moduleItem.moduleKey,
          ),
          status: membership.status,
          title: membership.title,
          employeeCode: membership.employeeCode,
          roleKeys: membership.roleAssignments.map(
            (assignment) => assignment.role.key,
          ),
          roleScopeKeys: membership.roleAssignments.map(
            (assignment) => assignment.role.scopeKey,
          ),
          roleNames: membership.roleAssignments.map(
            (assignment) => assignment.role.name,
          ),
          rolePermissionKeys:
            membership.status === MembershipStatus.ACTIVE
              ? Array.from(new Set(rolePermissionKeys))
              : [],
          allowPermissionKeys: overrideGroups.allowPermissionKeys,
          denyPermissionKeys: overrideGroups.denyPermissionKeys,
          permissionKeys,
        };
      });

      return {
        id: user.id,
        name: this.getUserDisplayName(user),
        email: user.email,
        identifier: user.documentNumber,
        status: user.status,
        scope,
        firstName: user.firstName,
        lastName: user.lastName,
        documentType: user.documentType,
        phone: user.phone,
        platformRoleScopeKeys:
          user.platformAccess?.roleAssignments.map(
            (assignment) => assignment.role.scopeKey,
          ) ?? [],
        platformRoleNames:
          user.platformAccess?.roleAssignments.map(
            (assignment) => assignment.role.name,
          ) ?? [],
        platformRolePermissionKeys: Array.from(
          new Set(platformRolePermissionKeys),
        ),
        platformAllowPermissionKeys: platformOverrideGroups.allowPermissionKeys,
        platformDenyPermissionKeys: platformOverrideGroups.denyPermissionKeys,
        platformPermissionKeys,
        effectivePermissionKeys: Array.from(
          new Set([
            ...platformPermissionKeys,
            ...memberships.flatMap((membership) => membership.permissionKeys),
          ]),
        ),
        memberships,
        organizations: user.memberships.map((membership) => ({
          slug: membership.organization.slug,
          name:
            membership.organization.tradeName ??
            membership.organization.legalName,
          status: membership.status,
        })),
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async listOrganizationUsersForPlatform(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    await this.ensureOrganizationExists(input.organizationId);

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.MembershipWhereInput = {
      organizationId: input.organizationId,
      status: { not: MembershipStatus.TERMINATED },
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { employeeCode: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              {
                user: { firstName: { contains: search, mode: 'insensitive' } },
              },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              {
                user: {
                  documentNumber: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [memberships, total] = await Promise.all([
      this.prismaService.membership.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          status: true,
          title: true,
          employeeCode: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              documentType: true,
              documentNumber: true,
              phone: true,
              status: true,
            },
          },
          roleAssignments: {
            select: {
              role: {
                select: {
                  scopeKey: true,
                  key: true,
                  name: true,
                  isSystem: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.membership.count({ where }),
    ]);

    return {
      data: memberships.map((membership) => ({
        id: membership.id,
        status: membership.status,
        title: membership.title,
        employeeCode: membership.employeeCode,
        createdAt: membership.createdAt,
        user: membership.user,
        roleScopeKeys: membership.roleAssignments.map(
          (assignment) => assignment.role.scopeKey,
        ),
        roleNames: membership.roleAssignments.map(
          (assignment) => assignment.role.name,
        ),
        roles: membership.roleAssignments.map((assignment) => ({
          scopeKey: assignment.role.scopeKey,
          key: assignment.role.key,
          name: assignment.role.name,
          isSystem: assignment.role.isSystem,
        })),
      })),
      total,
      page,
      limit,
    };
  }

  async listRoleTemplates() {
    const roles = await this.prismaService.role.findMany({
      where: {
        organizationId: null,
      },
      orderBy: [{ context: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        scopeKey: true,
        key: true,
        name: true,
        description: true,
        context: true,
        permissions: {
          select: {
            permission: {
              select: {
                key: true,
              },
            },
          },
        },
        _count: {
          select: {
            permissions: true,
            membershipRoles: true,
            platformAccessRoles: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      scopeKey: role.scopeKey,
      key: role.key,
      name: role.name,
      description: role.description,
      context: role.context,
      permissionCount: role._count.permissions,
      permissionKeys: role.permissions.map(
        (assignment) => assignment.permission.key,
      ),
      memberCount:
        role._count.membershipRoles + role._count.platformAccessRoles,
    }));
  }

  async listPlatformModules() {
    const modules = await this.prismaService.platformModule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        key: true,
        name: true,
        icon: true,
        audience: true,
        sortOrder: true,
        submodules: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            key: true,
            name: true,
            route: true,
            permissionKey: true,
            sortOrder: true,
          },
        },
      },
    });

    return modules.map((moduleItem) => ({
      id: moduleItem.id,
      key: moduleItem.key,
      name: moduleItem.name,
      icon: moduleItem.icon,
      audience: moduleItem.audience,
      sortOrder: moduleItem.sortOrder,
      summary: this.getModuleSummary(moduleItem.key, moduleItem.audience),
      submodules: moduleItem.submodules,
    }));
  }

  async listPermissions() {
    return this.prismaService.permission.findMany({
      orderBy: [
        { audience: 'asc' },
        { moduleKey: 'asc' },
        { submoduleKey: 'asc' },
        { key: 'asc' },
      ],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        moduleKey: true,
        submoduleKey: true,
        scope: true,
        audience: true,
      },
    });
  }

  async createOrganization(input: CreatePlatformOrganizationDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const slug = await this.createUniqueOrganizationSlug(
          input.slug ?? input.tradeName ?? input.legalName,
          transaction,
        );
        const organization = await transaction.organization.create({
          data: {
            legalName: input.legalName,
            tradeName: input.tradeName ?? null,
            slug,
            documentType: input.documentNumber ? 'RUC' : null,
            documentNumber: input.documentNumber ?? null,
            email: input.email ?? null,
            phone: input.phone ?? null,
            status: input.status ?? OrganizationStatus.TRIAL,
          },
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            slug: true,
            documentNumber: true,
            status: true,
          },
        });

        if (input.moduleKeys && input.moduleKeys.length > 0) {
          for (const moduleKey of input.moduleKeys) {
            await transaction.organizationModule.upsert({
              where: {
                organizationId_moduleKey: {
                  organizationId: organization.id,
                  moduleKey,
                },
              },
              update: {
                enabled: true,
              },
              create: {
                organizationId: organization.id,
                moduleKey,
                enabled: true,
              },
            });
          }
        }

        if (input.ownerUserId) {
          const role = await transaction.role.findUnique({
            where: { scopeKey: 'system:organization.owner' },
            select: { id: true },
          });

          if (!role) {
            throw new NotFoundException('No se encontro el rol base owner.');
          }

          const membership = await transaction.membership.create({
            data: {
              userId: input.ownerUserId,
              organizationId: organization.id,
              status: MembershipStatus.ACTIVE,
            },
            select: { id: true },
          });

          await transaction.membershipRole.create({
            data: {
              membershipId: membership.id,
              roleId: role.id,
            },
          });
        }

        return organization;
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo crear la organizacion.');
      throw error;
    }
  }

  async createGlobalUser(input: CreatePlatformUserDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const passwordHash = await hash(input.password, 12);

        const user = await transaction.user.create({
          data: {
            email: input.email,
            passwordHash,
            firstName: input.firstName ?? null,
            lastName: input.lastName ?? null,
            documentType: input.documentNumber
              ? (input.documentType ?? DocumentType.DNI)
              : null,
            documentNumber: input.documentNumber ?? null,
            phone: input.phone ?? null,
            status: input.status ?? UserStatus.ACTIVE,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            documentNumber: true,
            status: true,
          },
        });

        if (input.platformRoleScopeKey) {
          const role = await transaction.role.findUnique({
            where: { scopeKey: input.platformRoleScopeKey },
            select: { id: true, context: true },
          });

          if (!role || role.context !== RoleContext.PLATFORM) {
            throw new NotFoundException(
              'No se encontro el rol de plataforma solicitado.',
            );
          }

          const platformAccess = await transaction.platformAccess.upsert({
            where: { userId: user.id },
            update: {
              status: PlatformAccessStatus.ACTIVE,
            },
            create: {
              userId: user.id,
              status: PlatformAccessStatus.ACTIVE,
            },
            select: { id: true },
          });

          await transaction.platformAccessRole.create({
            data: {
              platformAccessId: platformAccess.id,
              roleId: role.id,
            },
          });
        }

        if (input.organizationId && input.organizationRoleScopeKey) {
          const role = await transaction.role.findUnique({
            where: { scopeKey: input.organizationRoleScopeKey },
            select: { id: true, context: true },
          });

          if (!role || role.context !== RoleContext.ORGANIZATION) {
            throw new NotFoundException(
              'No se encontro el rol de organizacion solicitado.',
            );
          }

          const membership = await transaction.membership.create({
            data: {
              userId: user.id,
              organizationId: input.organizationId,
              status: MembershipStatus.ACTIVE,
            },
            select: { id: true },
          });

          await transaction.membershipRole.create({
            data: {
              membershipId: membership.id,
              roleId: role.id,
            },
          });
        }

        return user;
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudo crear el usuario global.',
      );
      throw error;
    }
  }

  async createModule(input: CreatePlatformModuleDto) {
    try {
      return await this.prismaService.platformModule.create({
        data: {
          key: input.key,
          name: input.name,
          icon: input.icon ?? null,
          audience: input.audience,
          sortOrder: input.sortOrder ?? 0,
        },
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo crear el modulo.');
      throw error;
    }
  }

  async createSubmodule(input: CreatePlatformSubmoduleDto) {
    const moduleItem = await this.prismaService.platformModule.findUnique({
      where: { key: input.moduleKey },
      select: { id: true },
    });

    if (!moduleItem) {
      throw new NotFoundException('No se encontro el modulo indicado.');
    }

    try {
      return await this.prismaService.platformSubmodule.create({
        data: {
          moduleId: moduleItem.id,
          key: input.key,
          name: input.name,
          route: input.route,
          permissionKey: input.permissionKey ?? null,
          sortOrder: input.sortOrder ?? 0,
        },
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo crear el submodulo.');
      throw error;
    }
  }

  async createPermission(input: CreatePlatformPermissionDto) {
    if (input.moduleKey && input.submoduleKey) {
      const moduleItem = await this.prismaService.platformModule.findUnique({
        where: { key: input.moduleKey },
        select: {
          id: true,
          submodules: {
            where: { key: input.submoduleKey },
            select: { id: true },
          },
        },
      });

      if (!moduleItem || moduleItem.submodules.length === 0) {
        throw new NotFoundException(
          'El submodulo indicado no existe dentro del modulo seleccionado.',
        );
      }
    }

    try {
      return await this.prismaService.permission.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          moduleKey: input.moduleKey ?? null,
          submoduleKey: input.submoduleKey ?? null,
          scope: input.scope,
          audience: input.audience,
        },
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo crear el permiso.');
      throw error;
    }
  }

  async updateOrganization(id: string, input: UpdatePlatformOrganizationDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        await transaction.organization.update({
          where: { id },
          data: {
            legalName: input.legalName,
            tradeName: input.tradeName,
            slug: input.slug,
            documentNumber: input.documentNumber,
            email: input.email,
            phone: input.phone,
            status: input.status,
          },
        });

        if (input.moduleKeys) {
          await transaction.organizationModule.updateMany({
            where: { organizationId: id },
            data: { enabled: false },
          });

          for (const moduleKey of input.moduleKeys) {
            await transaction.organizationModule.upsert({
              where: {
                organizationId_moduleKey: {
                  organizationId: id,
                  moduleKey,
                },
              },
              update: { enabled: true },
              create: {
                organizationId: id,
                moduleKey,
                enabled: true,
              },
            });
          }
        }

        if (input.ownerUserId) {
          const ownerRole = await transaction.role.findUnique({
            where: { scopeKey: 'system:organization.owner' },
            select: { id: true },
          });

          if (!ownerRole) {
            throw new NotFoundException('No se encontro el rol owner base.');
          }

          await transaction.membershipRole.deleteMany({
            where: {
              roleId: ownerRole.id,
              membership: {
                organizationId: id,
              },
            },
          });

          const membership = await transaction.membership.upsert({
            where: {
              userId_organizationId: {
                userId: input.ownerUserId,
                organizationId: id,
              },
            },
            update: {
              status: MembershipStatus.ACTIVE,
            },
            create: {
              userId: input.ownerUserId,
              organizationId: id,
              status: MembershipStatus.ACTIVE,
            },
            select: { id: true },
          });

          await transaction.membershipRole.upsert({
            where: {
              membershipId_roleId: {
                membershipId: membership.id,
                roleId: ownerRole.id,
              },
            },
            update: {},
            create: {
              membershipId: membership.id,
              roleId: ownerRole.id,
            },
          });
        }

        const organization = await transaction.organization.findUnique({
          where: { id },
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            slug: true,
            documentNumber: true,
            email: true,
            phone: true,
            status: true,
          },
        });

        if (!organization) {
          throw new NotFoundException('No se encontro la organizacion.');
        }

        return organization;
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudo actualizar la organizacion.',
      );
      throw error;
    }
  }

  async updateGlobalUser(id: string, input: UpdatePlatformUserDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        await transaction.user.update({
          where: { id },
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            documentType: input.documentType,
            documentNumber: input.documentNumber,
            phone: input.phone,
            status: input.status,
          },
        });

        if (input.platformRoleScopeKey !== undefined) {
          await transaction.platformAccessRole.deleteMany({
            where: {
              platformAccess: {
                userId: id,
              },
            },
          });

          if (input.platformRoleScopeKey) {
            const role = await transaction.role.findUnique({
              where: { scopeKey: input.platformRoleScopeKey },
              select: { id: true, context: true },
            });

            if (!role || role.context !== RoleContext.PLATFORM) {
              throw new NotFoundException(
                'No se encontro el rol de plataforma solicitado.',
              );
            }

            const platformAccess = await transaction.platformAccess.upsert({
              where: { userId: id },
              update: {
                status: PlatformAccessStatus.ACTIVE,
              },
              create: {
                userId: id,
                status: PlatformAccessStatus.ACTIVE,
              },
              select: { id: true },
            });

            await transaction.platformAccessRole.create({
              data: {
                platformAccessId: platformAccess.id,
                roleId: role.id,
              },
            });
          }
        }

        return transaction.user.findUniqueOrThrow({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            documentNumber: true,
            status: true,
          },
        });
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo actualizar el usuario.');
      throw error;
    }
  }

  async assignMembership(userId: string, input: AssignPlatformMembershipDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const membership = await transaction.membership.upsert({
          where: {
            userId_organizationId: {
              userId,
              organizationId: input.organizationId,
            },
          },
          update: {
            status: input.status ?? MembershipStatus.ACTIVE,
            title: input.title,
            employeeCode: input.employeeCode,
            endsAt: null,
          },
          create: {
            userId,
            organizationId: input.organizationId,
            status: input.status ?? MembershipStatus.ACTIVE,
            title: input.title,
            employeeCode: input.employeeCode,
          },
          select: { id: true },
        });

        const roleScopeKeys = Array.from(
          new Set([
            ...(input.roleScopeKeys ?? []),
            ...(input.roleScopeKey ? [input.roleScopeKey] : []),
          ]),
        );

        if (input.replaceRoles) {
          await transaction.membershipRole.deleteMany({
            where: { membershipId: membership.id },
          });
        }

        if (roleScopeKeys.length > 0) {
          const roles = await transaction.role.findMany({
            where: {
              context: RoleContext.ORGANIZATION,
              scopeKey: { in: roleScopeKeys },
              OR: [
                { organizationId: null },
                { organizationId: input.organizationId },
              ],
            },
            select: { id: true },
          });

          if (roles.length !== roleScopeKeys.length) {
            throw new NotFoundException(
              'Uno o mas roles de organizacion no existen o no pertenecen a esa organizacion.',
            );
          }

          for (const role of roles) {
            await transaction.membershipRole.upsert({
              where: {
                membershipId_roleId: {
                  membershipId: membership.id,
                  roleId: role.id,
                },
              },
              update: {},
              create: {
                membershipId: membership.id,
                roleId: role.id,
              },
            });
          }
        }

        return transaction.membership.findUniqueOrThrow({
          where: { id: membership.id },
          select: {
            id: true,
            status: true,
            title: true,
            employeeCode: true,
            organization: {
              select: {
                id: true,
                slug: true,
                legalName: true,
                tradeName: true,
              },
            },
            roleAssignments: {
              select: {
                role: {
                  select: {
                    key: true,
                    scopeKey: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo asignar la membership.');
      throw error;
    }
  }

  async updatePlatformPermissionOverrides(
    userId: string,
    input: UpdatePermissionOverridesDto,
  ) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const platformAccess = await transaction.platformAccess.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!platformAccess) {
          throw new NotFoundException(
            'El usuario no tiene acceso de plataforma.',
          );
        }

        await this.replacePlatformPermissionOverrides(
          transaction,
          platformAccess.id,
          input,
        );

        return { ok: true };
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudieron actualizar los permisos de plataforma.',
      );
      throw error;
    }
  }

  async updateMembershipPermissionOverrides(
    userId: string,
    membershipId: string,
    input: UpdatePermissionOverridesDto,
  ) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const membership = await transaction.membership.findFirst({
          where: { id: membershipId, userId },
          select: { id: true },
        });

        if (!membership) {
          throw new NotFoundException('No se encontro la membership indicada.');
        }

        await this.replaceMembershipPermissionOverrides(
          transaction,
          membership.id,
          input,
        );

        return { ok: true };
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudieron actualizar los permisos de la membership.',
      );
      throw error;
    }
  }

  async unlinkMembership(userId: string, membershipId: string) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const membership = await transaction.membership.findFirst({
          where: { id: membershipId, userId },
          select: { id: true },
        });

        if (!membership) {
          throw new NotFoundException('No se encontro la membership indicada.');
        }

        return transaction.membership.update({
          where: { id: membership.id },
          data: {
            status: MembershipStatus.TERMINATED,
            endsAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            endsAt: true,
          },
        });
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudo desvincular la membership.',
      );
      throw error;
    }
  }

  async updateModule(id: string, input: UpdatePlatformModuleDto) {
    try {
      return await this.prismaService.platformModule.update({
        where: { id },
        data: {
          name: input.name,
          icon: input.icon,
          audience: input.audience,
          sortOrder: input.sortOrder,
        },
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo actualizar el modulo.');
      throw error;
    }
  }

  async updateSubmodule(id: string, input: UpdatePlatformSubmoduleDto) {
    try {
      return await this.prismaService.platformSubmodule.update({
        where: { id },
        data: {
          name: input.name,
          route: input.route,
          permissionKey: input.permissionKey,
          sortOrder: input.sortOrder,
        },
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudo actualizar el submodulo.',
      );
      throw error;
    }
  }

  async updatePermission(id: string, input: UpdatePlatformPermissionDto) {
    if (input.moduleKey && input.submoduleKey) {
      const moduleItem = await this.prismaService.platformModule.findUnique({
        where: { key: input.moduleKey },
        select: {
          submodules: {
            where: { key: input.submoduleKey },
            select: { id: true },
          },
        },
      });

      if (!moduleItem || moduleItem.submodules.length === 0) {
        throw new NotFoundException(
          'El submodulo indicado no existe dentro del modulo seleccionado.',
        );
      }
    }

    try {
      return await this.prismaService.permission.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          moduleKey: input.moduleKey,
          submoduleKey: input.submoduleKey,
          scope: input.scope,
          audience: input.audience,
        },
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo actualizar el permiso.');
      throw error;
    }
  }

  async updateRoleTemplate(id: string, input: UpdatePlatformRoleDto) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        if (input.permissionKeys) {
          const permissions = await transaction.permission.findMany({
            where: {
              key: { in: input.permissionKeys },
            },
            select: { id: true, key: true },
          });

          if (permissions.length !== input.permissionKeys.length) {
            throw new NotFoundException(
              'Uno o mas permisos indicados no existen.',
            );
          }

          await transaction.rolePermission.deleteMany({
            where: { roleId: id },
          });

          if (permissions.length > 0) {
            await transaction.rolePermission.createMany({
              data: permissions.map((permission) => ({
                roleId: id,
                permissionId: permission.id,
              })),
            });
          }
        }

        const role = await transaction.role.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
          },
          select: {
            id: true,
            scopeKey: true,
            key: true,
            name: true,
            description: true,
            context: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    key: true,
                  },
                },
              },
            },
            _count: {
              select: {
                permissions: true,
                membershipRoles: true,
                platformAccessRoles: true,
              },
            },
          },
        });

        return {
          id: role.id,
          scopeKey: role.scopeKey,
          key: role.key,
          name: role.name,
          description: role.description,
          context: role.context,
          permissionCount: role._count.permissions,
          permissionKeys: role.permissions.map(
            (assignment) => assignment.permission.key,
          ),
          memberCount:
            role._count.membershipRoles + role._count.platformAccessRoles,
        };
      });
    } catch (error) {
      this.handleKnownPrismaErrors(error, 'No se pudo actualizar el rol.');
      throw error;
    }
  }

  async listOrganizationRoles(organizationId: string) {
    await this.ensureOrganizationExists(organizationId);

    const roles = await this.prismaService.role.findMany({
      where: {
        context: RoleContext.ORGANIZATION,
        OR: [{ organizationId: null }, { organizationId }],
      },
      orderBy: [{ organizationId: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        scopeKey: true,
        key: true,
        name: true,
        description: true,
        context: true,
        organizationId: true,
        isSystem: true,
        permissions: {
          select: {
            permission: {
              select: {
                key: true,
              },
            },
          },
        },
        _count: {
          select: {
            permissions: true,
            membershipRoles: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      scopeKey: role.scopeKey,
      key: role.key,
      name: role.name,
      description: role.description,
      context: role.context,
      organizationId: role.organizationId,
      isSystem: role.isSystem,
      permissionCount: role._count.permissions,
      permissionKeys: role.permissions.map(
        (assignment) => assignment.permission.key,
      ),
      memberCount: role._count.membershipRoles,
    }));
  }

  async createOrganizationRole(
    organizationId: string,
    input: CreateOrganizationRoleDto,
  ) {
    await this.ensureOrganizationExists(organizationId);

    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const permissions = await this.resolvePermissionIds(
          transaction,
          input.permissionKeys ?? [],
        );
        const role = await transaction.role.create({
          data: {
            context: RoleContext.ORGANIZATION,
            scopeKey: `organization:${organizationId}:${input.key}`,
            organizationId,
            key: input.key,
            name: input.name,
            description: input.description ?? null,
            isSystem: false,
          },
          select: {
            id: true,
          },
        });

        if (permissions.length > 0) {
          await transaction.rolePermission.createMany({
            data: permissions.map((permission) => ({
              roleId: role.id,
              permissionId: permission.id,
            })),
          });
        }

        return this.findRoleSummary(transaction, role.id);
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudo crear el rol personalizado.',
      );
      throw error;
    }
  }

  async updateOrganizationRole(
    organizationId: string,
    roleId: string,
    input: UpdatePlatformRoleDto,
  ) {
    try {
      return await this.prismaService.$transaction(async (transaction) => {
        const currentRole = await transaction.role.findFirst({
          where: {
            id: roleId,
            organizationId,
            context: RoleContext.ORGANIZATION,
            isSystem: false,
          },
          select: {
            id: true,
          },
        });

        if (!currentRole) {
          throw new NotFoundException(
            'No se encontro un rol personalizado editable para esa organizacion.',
          );
        }

        if (input.permissionKeys) {
          const permissions = await this.resolvePermissionIds(
            transaction,
            input.permissionKeys,
          );

          await transaction.rolePermission.deleteMany({
            where: { roleId },
          });

          if (permissions.length > 0) {
            await transaction.rolePermission.createMany({
              data: permissions.map((permission) => ({
                roleId,
                permissionId: permission.id,
              })),
            });
          }
        }

        await transaction.role.update({
          where: { id: roleId },
          data: {
            name: input.name,
            description: input.description,
          },
        });

        return this.findRoleSummary(transaction, roleId);
      });
    } catch (error) {
      this.handleKnownPrismaErrors(
        error,
        'No se pudo actualizar el rol personalizado.',
      );
      throw error;
    }
  }

  private resolveUserScope(user: {
    platformAccess: { status: PlatformAccessStatus } | null;
    memberships: Array<{
      roleAssignments: Array<{
        role: {
          key: string;
        };
      }>;
    }>;
  }) {
    if (user.platformAccess?.status === PlatformAccessStatus.ACTIVE) {
      return 'PLATFORM';
    }

    const isOwner = user.memberships.some((membership) =>
      membership.roleAssignments.some(
        (assignment) => assignment.role.key === 'organization.owner',
      ),
    );

    if (isOwner) {
      return 'OWNER';
    }

    return 'MANAGER';
  }

  private getUserDisplayName(
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      documentNumber: string | null;
    } | null,
  ) {
    if (!user) {
      return null;
    }

    const fullName = [user.firstName, user.lastName]
      .filter((value) => Boolean(value?.trim()))
      .join(' ')
      .trim();

    if (fullName) {
      return fullName;
    }

    if (user.email?.trim()) {
      return user.email;
    }

    return user.documentNumber ?? 'Sin nombre';
  }

  private getModuleSummary(moduleKey: string, audience: ModuleAudience) {
    const summaries: Record<string, string> = {
      platform:
        'Gobierna clientes, owners, catalogos base y actividad de toda la plataforma.',
      settings:
        'Controla empresa, sucursales, usuarios, roles y parametros globales.',
      rrhh: 'Administra colaboradores, asistencia y planillas del cliente.',
      sales:
        'Agrupa clientes, cotizaciones, pedidos y el flujo comercial principal.',
      cash: 'Controla aperturas, movimientos y cierres de caja por sede.',
      inventory:
        'Centraliza productos, categorias, stock y ajustes de inventario.',
      billing:
        'Reune documentos, series e integraciones de facturacion electronica.',
      reports: 'Expone reportes para ventas, caja, inventario y clientes.',
      operations: 'Ordena manifiestos, transportistas y rutas operativas.',
    };

    if (summaries[moduleKey]) {
      return summaries[moduleKey];
    }

    return audience === ModuleAudience.PLATFORM
      ? 'Modulo reservado para gobierno global de Kapos.'
      : 'Modulo funcional del ERP listo para crecer por organizacion.';
  }

  private normalizeNullableString(value: string | undefined) {
    return value === undefined ? undefined : value;
  }

  private applyPermissionOverrides(
    basePermissionKeys: string[],
    overrides: Array<{
      effect: PermissionOverrideEffect;
      permission: { key: string };
    }>,
  ) {
    const permissionKeys = new Set(basePermissionKeys);

    for (const override of overrides) {
      if (override.effect === PermissionOverrideEffect.ALLOW) {
        permissionKeys.add(override.permission.key);
      }

      if (override.effect === PermissionOverrideEffect.DENY) {
        permissionKeys.delete(override.permission.key);
      }
    }

    return Array.from(permissionKeys);
  }

  private groupPermissionOverrides(
    overrides: Array<{
      effect: PermissionOverrideEffect;
      permission: { key: string };
    }>,
  ) {
    return {
      allowPermissionKeys: overrides
        .filter(
          (override) => override.effect === PermissionOverrideEffect.ALLOW,
        )
        .map((override) => override.permission.key),
      denyPermissionKeys: overrides
        .filter((override) => override.effect === PermissionOverrideEffect.DENY)
        .map((override) => override.permission.key),
    };
  }

  private async replaceMembershipPermissionOverrides(
    transaction: Prisma.TransactionClient,
    membershipId: string,
    input: UpdatePermissionOverridesDto,
  ) {
    const normalized = await this.normalizeOverridePermissionIds(
      transaction,
      input,
    );

    await transaction.membershipPermissionOverride.deleteMany({
      where: { membershipId },
    });

    if (normalized.length > 0) {
      await transaction.membershipPermissionOverride.createMany({
        data: normalized.map((override) => ({
          membershipId,
          permissionId: override.permissionId,
          effect: override.effect,
        })),
      });
    }
  }

  private async replacePlatformPermissionOverrides(
    transaction: Prisma.TransactionClient,
    platformAccessId: string,
    input: UpdatePermissionOverridesDto,
  ) {
    const normalized = await this.normalizeOverridePermissionIds(
      transaction,
      input,
    );

    await transaction.platformAccessPermissionOverride.deleteMany({
      where: { platformAccessId },
    });

    if (normalized.length > 0) {
      await transaction.platformAccessPermissionOverride.createMany({
        data: normalized.map((override) => ({
          platformAccessId,
          permissionId: override.permissionId,
          effect: override.effect,
        })),
      });
    }
  }

  private async normalizeOverridePermissionIds(
    transaction: Prisma.TransactionClient,
    input: UpdatePermissionOverridesDto,
  ) {
    const allowKeys = new Set(input.allowPermissionKeys ?? []);
    const denyKeys = new Set(input.denyPermissionKeys ?? []);

    for (const key of denyKeys) {
      allowKeys.delete(key);
    }

    const requestedKeys = Array.from(new Set([...allowKeys, ...denyKeys]));
    const permissions = await this.resolvePermissionIds(
      transaction,
      requestedKeys,
    );
    const permissionIdByKey = new Map(
      permissions.map((permission) => [permission.key, permission.id]),
    );

    return [
      ...Array.from(allowKeys).map((key) => ({
        permissionId: permissionIdByKey.get(key)!,
        effect: PermissionOverrideEffect.ALLOW,
      })),
      ...Array.from(denyKeys).map((key) => ({
        permissionId: permissionIdByKey.get(key)!,
        effect: PermissionOverrideEffect.DENY,
      })),
    ];
  }

  private async ensureOrganizationExists(organizationId: string) {
    const organization = await this.prismaService.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('No se encontro la organizacion.');
    }
  }

  private async createUniqueOrganizationSlug(
    value: string,
    client: Prisma.TransactionClient | PrismaService = this.prismaService,
    ignoreOrganizationId?: string,
  ) {
    const baseSlug = this.slugify(value, 'organizacion');
    let nextSlug = baseSlug;
    let suffix = 2;

    while (
      await client.organization.findFirst({
        where: {
          slug: nextSlug,
          ...(ignoreOrganizationId
            ? { id: { not: ignoreOrganizationId } }
            : {}),
        },
        select: { id: true },
      })
    ) {
      nextSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return nextSlug;
  }

  private slugify(value: string, fallback: string) {
    const normalized = value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || fallback;
  }

  private async resolvePermissionIds(
    transaction: Prisma.TransactionClient,
    permissionKeys: string[],
  ) {
    if (permissionKeys.length === 0) {
      return [];
    }

    const permissions = await transaction.permission.findMany({
      where: {
        key: { in: permissionKeys },
      },
      select: { id: true, key: true },
    });

    if (permissions.length !== permissionKeys.length) {
      throw new NotFoundException('Uno o mas permisos indicados no existen.');
    }

    return permissions;
  }

  private async findRoleSummary(
    transaction: Prisma.TransactionClient,
    roleId: string,
  ) {
    const role = await transaction.role.findUniqueOrThrow({
      where: { id: roleId },
      select: {
        id: true,
        scopeKey: true,
        key: true,
        name: true,
        description: true,
        context: true,
        organizationId: true,
        isSystem: true,
        permissions: {
          select: {
            permission: {
              select: {
                key: true,
              },
            },
          },
        },
        _count: {
          select: {
            permissions: true,
            membershipRoles: true,
            platformAccessRoles: true,
          },
        },
      },
    });

    return {
      id: role.id,
      scopeKey: role.scopeKey,
      key: role.key,
      name: role.name,
      description: role.description,
      context: role.context,
      organizationId: role.organizationId,
      isSystem: role.isSystem,
      permissionCount: role._count.permissions,
      permissionKeys: role.permissions.map(
        (assignment) => assignment.permission.key,
      ),
      memberCount:
        role._count.membershipRoles + role._count.platformAccessRoles,
    };
  }

  private handleKnownPrismaErrors(
    error: unknown,
    defaultMessage: string,
  ): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe un registro con ese dato unico.');
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(defaultMessage);
    }
  }
}
