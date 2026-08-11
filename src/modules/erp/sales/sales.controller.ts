import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { OrganizationAuthorizationContext } from '../../../common/authorization/authorization.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermissions('sales.pos.read')
  listSales(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.salesService.listSales({
      organizationId: organizationContext.organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Post()
  @RequirePermissions('sales.pos.create')
  createSale(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Body() input: CreateSaleDto,
  ) {
    return this.salesService.createSale(
      organizationContext.organizationId,
      user.userId,
      input,
    );
  }

  @Post(':id/cancel')
  @RequirePermissions('sales.pos.cancel')
  cancelSale(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') saleId: string,
    @Body() input: CancelSaleDto,
  ) {
    return this.salesService.cancelSale(
      organizationContext.organizationId,
      user.userId,
      saleId,
      input,
    );
  }
}
