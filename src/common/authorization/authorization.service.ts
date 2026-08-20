import { Injectable } from '@nestjs/common';
import {
  MembershipStatus,
  PermissionOverrideEffect,
  PlatformAccessStatus,
  RoleContext,
} from '../../database/prisma/generated/client';
import { PrismaService } from '../../database/prisma/prisma.service';

export type OrganizationAuthorizationContext = {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  membershipId: string;
  membershipStatus: MembershipStatus;
  roleKeys: string[];
  permissionKeys: string[];
  branchIds: string[];
  moduleKeys: string[];
};

export type PlatformAuthorizationContext = {
  platformAccessId: string;
  status: PlatformAccessStatus;
  roleKeys: string[];
  permissionKeys: string[];
};

export type NavigationSubmoduleItem = {
  id: string;
  key: string;
  name: string;
  route: string;
  permissionKey: string | null;
  sortOrder: number;
};

export type NavigationModuleItem = {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  audience: 'PLATFORM' | 'ORGANIZATION' | 'BOTH';
  sortOrder: number;
  submodules: NavigationSubmoduleItem[];
};

@Injectable()
export class AuthorizationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrganizationContextForUser(input: {
    userId: string;
    organizationId?: string;
    organizationSlug?: string;
  }): Promise<OrganizationAuthorizationContext | null> {
    const organizationFilter =
      input.organizationId !== undefined
        ? { id: input.organizationId }
        : input.organizationSlug !== undefined
          ? { slug: input.organizationSlug }
          : null;

    if (!organizationFilter) {
      return null;
    }

    const membership = await this.prismaService.membership.findFirst({
      where: {
        userId: input.userId,
        status: MembershipStatus.ACTIVE,
        organization: organizationFilter,
      },
      select: {
        id: true,
        status: true,
        organization: {
          select: {
            id: true,
            slug: true,
            legalName: true,
            tradeName: true,
            branches: {
              select: {
                id: true,
              },
            },
            modules: {
              where: { enabled: true },
              select: { moduleKey: true },
            },
          },
        },
        branchAccess: {
          select: {
            branchId: true,
          },
        },
        roleAssignments: {
          select: {
            role: {
              select: {
                key: true,
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
      },
    });

    if (!membership) {
      return null;
    }

    const roleKeys = membership.roleAssignments.map(
      (assignment) => assignment.role.key,
    );
    const permissionKeys = this.applyPermissionOverrides(
      membership.roleAssignments.flatMap((assignment) =>
        assignment.role.permissions.map(
          (rolePermission) => rolePermission.permission.key,
        ),
      ),
      membership.permissionOverrides,
    );

    return {
      organizationId: membership.organization.id,
      organizationSlug: membership.organization.slug,
      organizationName:
        membership.organization.tradeName ?? membership.organization.legalName,
      membershipId: membership.id,
      membershipStatus: membership.status,
      roleKeys,
      permissionKeys,
      branchIds:
        membership.branchAccess.length > 0
          ? membership.branchAccess.map((branchAccess) => branchAccess.branchId)
          : membership.organization.branches.map((branch) => branch.id),
      moduleKeys: membership.organization.modules.map(
        (moduleItem) => moduleItem.moduleKey,
      ),
    };
  }

  async listMembershipContextsForUser(
    userId: string,
  ): Promise<OrganizationAuthorizationContext[]> {
    const memberships = await this.prismaService.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      orderBy: [{ createdAt: 'asc' }],
      select: {
        id: true,
        status: true,
        organization: {
          select: {
            id: true,
            slug: true,
            legalName: true,
            tradeName: true,
            branches: {
              select: {
                id: true,
              },
            },
            modules: {
              where: { enabled: true },
              select: { moduleKey: true },
            },
          },
        },
        branchAccess: {
          select: {
            branchId: true,
          },
        },
        roleAssignments: {
          select: {
            role: {
              select: {
                key: true,
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
      },
    });

    return memberships.map((membership) => {
      const roleKeys = membership.roleAssignments.map(
        (assignment) => assignment.role.key,
      );
      const permissionKeys = this.applyPermissionOverrides(
        membership.roleAssignments.flatMap((assignment) =>
          assignment.role.permissions.map(
            (rolePermission) => rolePermission.permission.key,
          ),
        ),
        membership.permissionOverrides,
      );

      return {
        organizationId: membership.organization.id,
        organizationSlug: membership.organization.slug,
        organizationName:
          membership.organization.tradeName ??
          membership.organization.legalName,
        membershipId: membership.id,
        membershipStatus: membership.status,
        roleKeys,
        permissionKeys,
        branchIds:
          membership.branchAccess.length > 0
            ? membership.branchAccess.map(
                (branchAccess) => branchAccess.branchId,
              )
            : membership.organization.branches.map((branch) => branch.id),
        moduleKeys: membership.organization.modules.map(
          (moduleItem) => moduleItem.moduleKey,
        ),
      };
    });
  }

  async getPlatformContextForUser(
    userId: string,
  ): Promise<PlatformAuthorizationContext | null> {
    const platformAccess = await this.prismaService.platformAccess.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                context: true,
                key: true,
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
      },
    });

    if (
      !platformAccess ||
      platformAccess.status !== PlatformAccessStatus.ACTIVE
    ) {
      return null;
    }

    const roleKeys = platformAccess.roleAssignments
      .filter((assignment) => assignment.role.context === RoleContext.PLATFORM)
      .map((assignment) => assignment.role.key);
    const permissionKeys = this.applyPermissionOverrides(
      platformAccess.roleAssignments.flatMap((assignment) =>
        assignment.role.permissions.map(
          (rolePermission) => rolePermission.permission.key,
        ),
      ),
      platformAccess.permissionOverrides,
    );

    return {
      platformAccessId: platformAccess.id,
      status: platformAccess.status,
      roleKeys,
      permissionKeys,
    };
  }

  async getNavigationCatalogForUser(
    userId: string,
  ): Promise<NavigationModuleItem[]> {
    const [platformContext, memberships, modules] = await Promise.all([
      this.getPlatformContextForUser(userId),
      this.listMembershipContextsForUser(userId),
      this.prismaService.platformModule.findMany({
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
      }),
    ]);

    const effectivePermissionKeys = new Set<string>([
      ...(platformContext?.permissionKeys ?? []),
      ...memberships.flatMap((membership) => membership.permissionKeys),
    ]);
    const effectiveOrganizationModuleKeys = new Set(
      memberships.flatMap((membership) => membership.moduleKeys),
    );
    const hasPlatformAccess = Boolean(platformContext);
    const hasOrganizationAccess = memberships.length > 0;

    return modules
      .filter((moduleItem) => {
        if (moduleItem.audience === 'PLATFORM') {
          return hasPlatformAccess;
        }

        if (moduleItem.audience === 'ORGANIZATION') {
          return (
            hasOrganizationAccess &&
            effectiveOrganizationModuleKeys.has(moduleItem.key)
          );
        }

        return (
          hasPlatformAccess ||
          (hasOrganizationAccess &&
            effectiveOrganizationModuleKeys.has(moduleItem.key))
        );
      })
      .map((moduleItem) => ({
        ...moduleItem,
        submodules: moduleItem.submodules.filter(
          (submodule) =>
            !submodule.permissionKey ||
            effectivePermissionKeys.has(submodule.permissionKey),
        ),
      }))
      .filter((moduleItem) => moduleItem.submodules.length > 0);
  }

  private applyPermissionOverrides(
    basePermissionKeys: string[],
    overrides: Array<{
      effect: PermissionOverrideEffect;
      permission: {
        key: string;
      };
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
}
