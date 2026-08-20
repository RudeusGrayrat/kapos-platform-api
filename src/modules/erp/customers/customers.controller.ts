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
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CustomersService } from './customers.service';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('sales.customers.read')
  listCustomers(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customersService.listCustomers({
      organizationId: organizationContext.organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Post()
  @RequirePermissions('sales.customers.create')
  upsertCustomer(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: UpsertCustomerDto,
  ) {
    return this.customersService.upsertCustomer(
      organizationContext.organizationId,
      input,
    );
  }

  @Get(':id/wallet')
  @RequirePermissions('sales.customers.read')
  getCustomerWallet(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('id') customerProfileId: string,
  ) {
    return this.customersService.getCustomerWallet(
      organizationContext.organizationId,
      customerProfileId,
    );
  }
}
