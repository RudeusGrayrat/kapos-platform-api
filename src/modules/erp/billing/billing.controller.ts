import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { OrganizationAuthorizationContext } from '../../../common/authorization/authorization.service';
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { BillingDocumentStatus } from '../../../database/prisma/generated/client';
import { BillingService } from './billing.service';
import {
  IssueBillingDocumentDto,
  UpdateBillingProviderDto,
  UpsertBillingSeriesDto,
} from './dto/billing-provider.dto';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('documents')
  @RequirePermissions('billing.documents.read')
  listDocuments(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
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

  @Get('provider')
  @RequirePermissions('billing.providers.read')
  getProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.billingService.getProviderConfig(
      organizationContext.organizationId,
    );
  }

  @Patch('provider')
  @RequirePermissions('billing.providers.update')
  updateProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: UpdateBillingProviderDto,
  ) {
    return this.billingService.updateProviderConfig(
      organizationContext.organizationId,
      input,
    );
  }

  @Post('provider')
  @RequirePermissions('billing.providers.create')
  createProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: UpdateBillingProviderDto,
  ) {
    return this.billingService.createProviderConfig(
      organizationContext.organizationId,
      input,
    );
  }

  @Post('provider/activate')
  @RequirePermissions('billing.providers.activate')
  activateProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.billingService.activateProviderConfig(
      organizationContext.organizationId,
    );
  }

  @Post('provider/deactivate')
  @RequirePermissions('billing.providers.deactivate')
  deactivateProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.billingService.deactivateProviderConfig(
      organizationContext.organizationId,
    );
  }

  @Delete('provider')
  @RequirePermissions('billing.providers.delete')
  deleteProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.billingService.deleteProviderConfig(
      organizationContext.organizationId,
    );
  }

  @Post('provider/test')
  @RequirePermissions('billing.providers.read')
  testProvider(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.billingService.testProvider(organizationContext.organizationId);
  }

  @Get('series')
  @RequirePermissions('billing.series.read')
  listSeries(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.billingService.listSeries(organizationContext.organizationId);
  }

  @Post('series')
  @RequirePermissions('billing.series.create')
  createSeries(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: UpsertBillingSeriesDto,
  ) {
    return this.billingService.createSeries(
      organizationContext.organizationId,
      input,
    );
  }

  @Patch('series/:seriesId')
  @RequirePermissions('billing.series.update')
  updateSeries(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('seriesId') seriesId: string,
    @Body() input: UpsertBillingSeriesDto,
  ) {
    return this.billingService.updateSeries(
      organizationContext.organizationId,
      seriesId,
      input,
    );
  }

  @Delete('series/:seriesId')
  @RequirePermissions('billing.series.delete')
  deleteSeries(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('seriesId') seriesId: string,
  ) {
    return this.billingService.deleteSeries(
      organizationContext.organizationId,
      seriesId,
    );
  }

  @Post('documents/:documentId/issue')
  @RequirePermissions('billing.documents.issue')
  issueDocument(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('documentId') documentId: string,
    @Body() input: IssueBillingDocumentDto,
  ) {
    return this.billingService.issueDocument(
      organizationContext.organizationId,
      documentId,
      input,
    );
  }

  @Post('sales/:saleId/issue')
  @RequirePermissions('billing.documents.issue')
  issueSaleDocument(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('saleId') saleId: string,
    @Body() input: IssueBillingDocumentDto,
  ) {
    return this.billingService.issueSaleDocument(
      organizationContext.organizationId,
      saleId,
      input,
    );
  }
}
