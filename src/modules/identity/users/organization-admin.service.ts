import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import {
  DocumentType,
  MembershipStatus,
  ModuleAudience,
  PermissionOverrideEffect,
  Prisma,
  RoleContext,
  RoleStatus,
  UserStatus,
} from '../../../database/prisma/generated/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateInternalRoleDto } from './dto/organization-admin/create-internal-role.dto';
import { CreateOrganizationUserDto } from './dto/organization-admin/create-organization-user.dto';
import { UpdateInternalRoleDto } from './dto/organization-admin/update-internal-role.dto';
import { UpdateOrganizationUserDto } from './dto/organization-admin/update-organization-user.dto';

@Injectable()
export class OrganizationAdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async listUsers(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
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
              { user: { firstName: { contains: search, mode: 'insensitive' } } },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              { user: { documentNumber: { contains: search, mode: 'insensitive' } } },
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
        include: this.membershipInclude(),
      }),
      this.prismaService.membership.count({ where }),
    ]);

    return {
      data: memberships.map((membership) => this.serializeMembership(membership)),
      total,
      page,
      limit,
    };
  }

  async createUser(
    organizationId: string,
    allowedPermissionKeys: string[],
    input: CreateOrganizationUserDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      await this.assertRolesCanBeAssigned(
        transaction,
        organizationId,
        input.roleScopeKeys ?? [],
        allowedPermissionKeys,
      );

      const existingUser = await transaction.user.findFirst({
        where: {
          OR: [
            { email: input.email },
            ...(input.documentNumber ? [{ documentNumber: input.documentNumber }] : []),
          ],
        },
        select: { id: true },
      });

      const user =
        existingUser ??
        (await transaction.user.create({
          data: {
            email: input.email,
            passwordHash: input.password ? await hash(input.password, 12) : null,
            firstName: input.firstName ?? null,
            lastName: input.lastName ?? null,
            documentType: input.documentNumber
              ? input.documentType ?? DocumentType.DNI
              : null,
            documentNumber: input.documentNumber ?? null,
            phone: input.phone ?? null,
            status:
              input.userStatus ??
              (input.password ? UserStatus.ACTIVE : UserStatus.INVITED),
          },
          select: { id: true },
        }));

      const membership = await transaction.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
        update: {
          status: input.membershipStatus ?? MembershipStatus.ACTIVE,
          title: input.title,
          employeeCode: input.employeeCode,
          endsAt: null,
        },
        create: {
          userId: user.id,
          organizationId,
          status: input.membershipStatus ?? MembershipStatus.ACTIVE,
          title: input.title,
          employeeCode: input.employeeCode,
        },
        select: { id: true },
      });

      await this.replaceMembershipRoles(
        transaction,
        organizationId,
        membership.id,
        input.roleScopeKeys ?? [],
      );

      return this.findMembershipSummary(transaction, membership.id);
    }).catch((error) => {
      this.handleKnownPrismaErrors(error, 'No se pudo crear o vincular el usuario.');
      throw error;
    });
  }

  async updateUser(
    organizationId: string,
    membershipId: string,
    allowedPermissionKeys: string[],
    input: UpdateOrganizationUserDto,
  ) {
    return this.prismaService.$transaction(async (transaction) => {
      const membership = await transaction.membership.findFirst({
        where: { id: membershipId, organizationId },
        select: { id: true, userId: true },
      });

      if (!membership) {
        throw new NotFoundException('No se encontro el usuario interno.');
      }

      if (input.roleScopeKeys) {
        await this.assertRolesCanBeAssigned(
          transaction,
          organizationId,
          input.roleScopeKeys,
          allowedPermissionKeys,
        );
      }

      await transaction.membership.update({
        where: { id: membership.id },
        data: {
          title: input.title,
          employeeCode: input.employeeCode,
          status: input.membershipStatus,
          endsAt:
            input.membershipStatus === MembershipStatus.TERMINATED
              ? new Date()
              : input.membershipStatus === MembershipStatus.ACTIVE
                ? null
                : undefined,
        },
      });

      if (input.roleScopeKeys) {
        await this.replaceMembershipRoles(
          transaction,
          organizationId,
          membership.id,
          input.roleScopeKeys,
        );
      }

      return this.findMembershipSummary(transaction, membership.id);
    }).catch((error) => {
      this.handleKnownPrismaErrors(error, 'No se pudo actualizar el usuario interno.');
      throw error;
    });
  }

  updateUserStatus(
    organizationId: string,
    membershipId: string,
    status: 'ACTIVE' | 'SUSPENDED',
  ) {
    return this.prismaService.membership
      .update({
        where: { id: membershipId, organizationId },
        data: {
          status,
          endsAt: status === MembershipStatus.ACTIVE ? null : undefined,
        },
        include: this.membershipInclude(),
      })
      .then((membership) => this.serializeMembership(membership));
  }

  async listRoles(input: {
    organizationId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(5, input.limit ?? 10));
    const search = input.search?.trim();
    const where: Prisma.RoleWhereInput = {
      context: RoleContext.ORGANIZATION,
      status: RoleStatus.ACTIVE,
      OR: [{ organizationId: null }, { organizationId: input.organizationId }],
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { key: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {}),
    };

    const [roles, total] = await Promise.all([
      this.prismaService.role.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        include: this.roleInclude(),
      }),
      this.prismaService.role.count({ where }),
    ]);

    return {
      data: roles.map((role) => this.serializeRole(role)),
      total,
      page,
      limit,
    };
  }

  async listAssignablePermissions(input: {
    allowedPermissionKeys: string[];
    moduleKeys: string[];
  }) {
    const permissions = await this.prismaService.permission.findMany({
      where: {
        key: { in: input.allowedPermissionKeys },
        audience: { in: [ModuleAudience.ORGANIZATION, ModuleAudience.BOTH] },
        OR: [
          { moduleKey: null },
          { moduleKey: { in: input.moduleKeys } },
        ],
      },
      orderBy: [{ moduleKey: 'asc' }, { submoduleKey: 'asc' }, { key: 'asc' }],
    });

    return permissions;
  }

  async createRole(
    organizationId: string,
    allowedPermissionKeys: string[],
    input: CreateInternalRoleDto,
  ) {
    this.assertPermissionKeysAreDelegable(
      input.permissionKeys ?? [],
      allowedPermissionKeys,
    );

    return this.prismaService.$transaction(async (transaction) => {
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
          status: RoleStatus.ACTIVE,
        },
        select: { id: true },
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
    }).catch((error) => {
      this.handleKnownPrismaErrors(error, 'No se pudo crear el rol interno.');
      throw error;
    });
  }

  async updateRole(
    organizationId: string,
    roleId: string,
    allowedPermissionKeys: string[],
    input: UpdateInternalRoleDto,
  ) {
    if (input.permissionKeys) {
      this.assertPermissionKeysAreDelegable(input.permissionKeys, allowedPermissionKeys);
    }

    return this.prismaService.$transaction(async (transaction) => {
      const role = await transaction.role.findFirst({
        where: {
          id: roleId,
          organizationId,
          context: RoleContext.ORGANIZATION,
          isSystem: false,
          status: RoleStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (!role) {
        throw new NotFoundException('No se encontro un rol personalizado editable.');
      }

      if (input.permissionKeys) {
        const permissions = await this.resolvePermissionIds(
          transaction,
          input.permissionKeys,
        );

        await transaction.rolePermission.deleteMany({ where: { roleId } });

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
    }).catch((error) => {
      this.handleKnownPrismaErrors(error, 'No se pudo actualizar el rol interno.');
      throw error;
    });
  }

  async archiveRole(organizationId: string, roleId: string) {
    const role = await this.prismaService.role.findFirst({
      where: {
        id: roleId,
        organizationId,
        context: RoleContext.ORGANIZATION,
        isSystem: false,
      },
      select: { id: true },
    });

    if (!role) {
      throw new NotFoundException('No se encontro un rol personalizado archivable.');
    }

    await this.prismaService.role.update({
      where: { id: roleId },
      data: { status: RoleStatus.ARCHIVED },
    });

    return { ok: true };
  }

  private async replaceMembershipRoles(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    membershipId: string,
    roleScopeKeys: string[],
  ) {
    await transaction.membershipRole.deleteMany({ where: { membershipId } });

    if (roleScopeKeys.length === 0) {
      return;
    }

    const roles = await transaction.role.findMany({
      where: {
        context: RoleContext.ORGANIZATION,
        status: RoleStatus.ACTIVE,
        scopeKey: { in: roleScopeKeys },
        OR: [{ organizationId: null }, { organizationId }],
      },
      select: { id: true },
    });

    if (roles.length !== roleScopeKeys.length) {
      throw new NotFoundException('Uno o mas roles no existen o no pertenecen a la organizacion.');
    }

    await transaction.membershipRole.createMany({
      data: roles.map((role) => ({
        membershipId,
        roleId: role.id,
      })),
      skipDuplicates: true,
    });
  }

  private async assertRolesCanBeAssigned(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    roleScopeKeys: string[],
    allowedPermissionKeys: string[],
  ) {
    if (roleScopeKeys.length === 0) {
      return;
    }

    const roles = await transaction.role.findMany({
      where: {
        context: RoleContext.ORGANIZATION,
        status: RoleStatus.ACTIVE,
        scopeKey: { in: roleScopeKeys },
        OR: [{ organizationId: null }, { organizationId }],
      },
      select: {
        scopeKey: true,
        permissions: {
          select: { permission: { select: { key: true } } },
        },
      },
    });

    if (roles.length !== roleScopeKeys.length) {
      throw new NotFoundException('Uno o mas roles no existen o no pertenecen a la organizacion.');
    }

    for (const role of roles) {
      this.assertPermissionKeysAreDelegable(
        role.permissions.map((assignment) => assignment.permission.key),
        allowedPermissionKeys,
      );
    }
  }

  private assertPermissionKeysAreDelegable(
    requestedPermissionKeys: string[],
    allowedPermissionKeys: string[],
  ) {
    const allowed = new Set(allowedPermissionKeys);
    const blocked = requestedPermissionKeys.filter((key) => !allowed.has(key));

    if (blocked.length > 0) {
      throw new ConflictException(
        `No puedes delegar permisos que no tienes: ${blocked.join(', ')}.`,
      );
    }
  }

  private async resolvePermissionIds(
    transaction: Prisma.TransactionClient,
    permissionKeys: string[],
  ) {
    const permissions = await transaction.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true, key: true },
    });

    if (permissions.length !== permissionKeys.length) {
      throw new NotFoundException('Uno o mas permisos indicados no existen.');
    }

    return permissions;
  }

  private async findMembershipSummary(
    transaction: Prisma.TransactionClient,
    membershipId: string,
  ) {
    const membership = await transaction.membership.findUniqueOrThrow({
      where: { id: membershipId },
      include: this.membershipInclude(),
    });

    return this.serializeMembership(membership);
  }

  private async findRoleSummary(
    transaction: Prisma.TransactionClient,
    roleId: string,
  ) {
    const role = await transaction.role.findUniqueOrThrow({
      where: { id: roleId },
      include: this.roleInclude(),
    });

    return this.serializeRole(role);
  }

  private membershipInclude() {
    return {
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
              id: true,
              scopeKey: true,
              key: true,
              name: true,
              organizationId: true,
              isSystem: true,
              status: true,
              permissions: {
                select: {
                  permission: { select: { key: true } },
                },
              },
            },
          },
        },
      },
      permissionOverrides: {
        select: {
          effect: true,
          permission: { select: { key: true } },
        },
      },
    };
  }

  private roleInclude() {
    return {
      permissions: {
        select: {
          permission: {
            select: {
              key: true,
              name: true,
              moduleKey: true,
              submoduleKey: true,
              scope: true,
              audience: true,
            },
          },
        },
      },
      _count: {
        select: { permissions: true, membershipRoles: true },
      },
    };
  }

  private serializeMembership(membership: {
    id: string;
    status: MembershipStatus;
    title: string | null;
    employeeCode: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      documentType: DocumentType | null;
      documentNumber: string | null;
      phone: string | null;
      status: UserStatus;
    };
    roleAssignments: Array<{
      role: {
        id: string;
        scopeKey: string;
        key: string;
        name: string;
        organizationId: string | null;
        isSystem: boolean;
        status: RoleStatus;
        permissions: Array<{ permission: { key: string } }>;
      };
    }>;
    permissionOverrides: Array<{
      effect: PermissionOverrideEffect;
      permission: { key: string };
    }>;
  }) {
    const rolePermissionKeys = membership.roleAssignments.flatMap((assignment) =>
      assignment.role.permissions.map((rolePermission) => rolePermission.permission.key),
    );
    const allowPermissionKeys = membership.permissionOverrides
      .filter((override) => override.effect === PermissionOverrideEffect.ALLOW)
      .map((override) => override.permission.key);
    const denyPermissionKeys = membership.permissionOverrides
      .filter((override) => override.effect === PermissionOverrideEffect.DENY)
      .map((override) => override.permission.key);
    const effectivePermissionKeys = new Set([
      ...rolePermissionKeys,
      ...allowPermissionKeys,
    ]);

    for (const key of denyPermissionKeys) {
      effectivePermissionKeys.delete(key);
    }

    return {
      id: membership.id,
      status: membership.status,
      title: membership.title,
      employeeCode: membership.employeeCode,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      user: membership.user,
      roleScopeKeys: membership.roleAssignments.map(
        (assignment) => assignment.role.scopeKey,
      ),
      roles: membership.roleAssignments.map((assignment) => ({
        id: assignment.role.id,
        scopeKey: assignment.role.scopeKey,
        key: assignment.role.key,
        name: assignment.role.name,
        organizationId: assignment.role.organizationId,
        isSystem: assignment.role.isSystem,
        status: assignment.role.status,
      })),
      rolePermissionKeys: Array.from(new Set(rolePermissionKeys)),
      allowPermissionKeys,
      denyPermissionKeys,
      effectivePermissionKeys: Array.from(effectivePermissionKeys),
    };
  }

  private serializeRole(role: {
    id: string;
    scopeKey: string;
    key: string;
    name: string;
    description: string | null;
    context: RoleContext;
    organizationId: string | null;
    isSystem: boolean;
    status: RoleStatus;
    permissions: Array<{
      permission: {
        key: string;
        name: string;
        moduleKey: string | null;
        submoduleKey: string | null;
        scope: string;
        audience: string;
      };
    }>;
    _count: { permissions: number; membershipRoles: number };
  }) {
    return {
      id: role.id,
      scopeKey: role.scopeKey,
      key: role.key,
      name: role.name,
      description: role.description,
      context: role.context,
      organizationId: role.organizationId,
      isSystem: role.isSystem,
      status: role.status,
      permissionCount: role._count.permissions,
      memberCount: role._count.membershipRoles,
      permissionKeys: role.permissions.map((assignment) => assignment.permission.key),
      permissions: role.permissions.map((assignment) => assignment.permission),
    };
  }

  private handleKnownPrismaErrors(error: unknown, fallbackMessage: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un registro con esos datos unicos.');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('No se encontro el registro solicitado.');
      }
    }

    throw error instanceof Error ? error : new Error(fallbackMessage);
  }
}
