import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthorizationService,
  OrganizationAuthorizationContext,
  PlatformAuthorizationContext,
} from '../authorization/authorization.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

type GuardRequest = {
  user?: {
    userId: string;
    email: string | null;
    sessionId?: string;
    platformContext?: PlatformAuthorizationContext;
    organizationContext?: OrganizationAuthorizationContext;
  };
  organizationContext?: OrganizationAuthorizationContext;
  platformContext?: PlatformAuthorizationContext;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[] | undefined>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const authenticatedUser = request.user;

    if (!authenticatedUser?.userId) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const platformPermissions = requiredPermissions.filter((permission) =>
      permission.startsWith('platform.'),
    );
    const organizationPermissions = requiredPermissions.filter(
      (permission) => !permission.startsWith('platform.'),
    );

    if (platformPermissions.length > 0) {
      if (!request.platformContext) {
        const platformContext =
          await this.authorizationService.getPlatformContextForUser(
            authenticatedUser.userId,
          );

        if (platformContext) {
          request.platformContext = platformContext;
          authenticatedUser.platformContext = platformContext;
        }
      }

      if (!request.platformContext) {
        throw new ForbiddenException(
          'No tienes acceso de plataforma para esta acción.',
        );
      }

      const missingPlatformPermissions = platformPermissions.filter(
        (permission) =>
          !request.platformContext?.permissionKeys.includes(permission),
      );

      if (missingPlatformPermissions.length > 0) {
        throw new ForbiddenException(
          `Faltan permisos de plataforma: ${missingPlatformPermissions.join(', ')}.`,
        );
      }
    }

    if (organizationPermissions.length > 0) {
      if (!request.organizationContext) {
        throw new ForbiddenException(
          'Esta acción requiere un contexto activo de organización.',
        );
      }

      authenticatedUser.organizationContext = request.organizationContext;

      const missingOrganizationPermissions = organizationPermissions.filter(
        (permission) =>
          !request.organizationContext?.permissionKeys.includes(permission),
      );

      if (missingOrganizationPermissions.length > 0) {
        throw new ForbiddenException(
          `Faltan permisos de organización: ${missingOrganizationPermissions.join(', ')}.`,
        );
      }
    }

    return true;
  }
}
