import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user as {
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
      platformContext?: {
        platformAccessId: string;
        roleKeys: string[];
        permissionKeys: string[];
      };
    };
  },
);
