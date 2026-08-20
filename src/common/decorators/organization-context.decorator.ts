import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrganizationAuthorizationContext } from '../authorization/authorization.service';

export const OrganizationContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.organizationContext as
      OrganizationAuthorizationContext | undefined;
  },
);
