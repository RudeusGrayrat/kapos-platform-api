import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { OrganizationAuthorizationContext } from '../../../common/authorization/authorization.service';
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { BillingDocumentStatus } from '../../../database/prisma/generated/client';
import { BillingService } from './billing.service';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('documents')
  @RequirePermissions('billing.documents.read')
  listDocuments(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: BillingDocumentStatus,
  ) {
    return this.billingService.listDocuments({
      organizationId: organizationContext.organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
    });
  }
}
