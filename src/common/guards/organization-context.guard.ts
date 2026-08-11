import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service';

type AuthenticatedRequest = {
  user?: {
    userId: string;
    email: string | null;
    sessionId?: string;
    organizationContext?: {
      organizationId: string;
      organizationSlug: string;
      organizationName: string;
      membershipId: string;
      roleKeys: string[];
      permissionKeys: string[];
      branchIds: string[];
      moduleKeys: string[];
    };
  };
  headers: Record<string, string | string[] | undefined>;
  organizationContext?: unknown;
};

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authenticatedUser = request.user;

    if (!authenticatedUser?.userId) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const organizationIdHeader = request.headers['x-organization-id'];
    const organizationSlugHeader = request.headers['x-organization-slug'];
    const organizationId = this.extractSingleHeaderValue(organizationIdHeader);
    const organizationSlug = this.extractSingleHeaderValue(
      organizationSlugHeader,
    );

    if (!organizationId && !organizationSlug) {
      throw new BadRequestException(
        'Debes enviar x-organization-id o x-organization-slug.',
      );
    }

    const organizationContext =
      await this.authorizationService.getOrganizationContextForUser({
        userId: authenticatedUser.userId,
        organizationId,
        organizationSlug,
      });

    if (!organizationContext) {
      throw new ForbiddenException(
        'No tienes acceso a esa organización o tu membership no está activa.',
      );
    }

    request.organizationContext = organizationContext;
    authenticatedUser.organizationContext = organizationContext;
    return true;
  }

  private extractSingleHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
