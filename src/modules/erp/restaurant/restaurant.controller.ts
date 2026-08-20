import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import {
  KitchenTicketStatus,
  OpenAccountStatus,
} from '../../../database/prisma/generated/client';
import { DiningSpacesService } from './dining-spaces.service';
import {
  CreateDiningAreaDto,
  CreateDiningTableDto,
  UpdateDiningAreaDto,
  UpdateDiningTableDto,
} from './dto/dining-space.dto';
import {
  AddOpenAccountItemsDto,
  CancelOpenAccountItemDto,
  CancelOpenAccountDto,
  CreateOpenAccountDto,
  GeneratePrebillDto,
  JoinOpenAccountTableDto,
  MoveOpenAccountTableDto,
  RecordOpenAccountPaymentDto,
  ReleaseOpenAccountTableDto,
  SendKitchenTicketDto,
  UpdateKitchenTicketDto,
  UpdateOpenAccountDto,
} from './dto/open-account.dto';
import { OpenAccountsService } from './open-accounts.service';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/restaurant')
export class RestaurantController {
  constructor(
    private readonly diningSpacesService: DiningSpacesService,
    private readonly openAccountsService: OpenAccountsService,
  ) {}

  @Get('areas')
  @RequirePermissions('settings.tables.read')
  listAreas(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Query('branchId') branchId?: string,
  ) {
    return this.diningSpacesService.listAreas(
      context.organizationId,
      context.branchIds,
      branchId,
    );
  }

  @Post('accounts/:id/table/move')
  @RequirePermissions('sales.orders.move_table')
  moveAccountTable(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: MoveOpenAccountTableDto,
  ) {
    return this.openAccountsService.moveAccountTable(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('accounts/:id/tables')
  @RequirePermissions('sales.orders.move_table')
  joinAccountTable(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: JoinOpenAccountTableDto,
  ) {
    return this.openAccountsService.joinAccountTable(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('accounts/:id/tables/:tableId/release')
  @RequirePermissions('sales.orders.move_table')
  releaseAccountTable(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Param('tableId') tableId: string,
    @Body() input: ReleaseOpenAccountTableDto,
  ) {
    return this.openAccountsService.releaseAccountTable(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      tableId,
      input,
    );
  }

  @Post('accounts/:id/prebill')
  @RequirePermissions('sales.orders.prebill')
  generatePrebill(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: GeneratePrebillDto,
  ) {
    return this.openAccountsService.generatePrebill(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('areas')
  @RequirePermissions('settings.tables.create')
  createArea(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Body() input: CreateDiningAreaDto,
  ) {
    return this.diningSpacesService.createArea(
      context.organizationId,
      context.branchIds,
      input,
    );
  }

  @Patch('areas/:id')
  @RequirePermissions('settings.tables.update')
  updateArea(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdateDiningAreaDto,
  ) {
    return this.diningSpacesService.updateArea(
      context.organizationId,
      context.branchIds,
      id,
      input,
    );
  }

  @Post('tables')
  @RequirePermissions('settings.tables.create')
  createTable(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Body() input: CreateDiningTableDto,
  ) {
    return this.diningSpacesService.createTable(
      context.organizationId,
      context.branchIds,
      input,
    );
  }

  @Patch('tables/:id')
  @RequirePermissions('settings.tables.update')
  updateTable(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdateDiningTableDto,
  ) {
    return this.diningSpacesService.updateTable(
      context.organizationId,
      context.branchIds,
      id,
      input,
    );
  }

  @Get('accounts')
  @RequirePermissions('sales.orders.read')
  listAccounts(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Query('branchId') branchId?: string,
    @Query('status') status?: OpenAccountStatus,
    @Query('serviceType') serviceType?: 'LOCAL' | 'DELIVERY' | 'TAKEAWAY',
    @Query('search') search?: string,
  ) {
    return this.openAccountsService.listAccounts({
      organizationId: context.organizationId,
      branchIds: context.branchIds,
      branchId,
      status,
      serviceType,
      search,
    });
  }

  @Post('accounts')
  @RequirePermissions('sales.orders.create')
  createAccount(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Body() input: CreateOpenAccountDto,
  ) {
    return this.openAccountsService.createAccount(
      context.organizationId,
      context.branchIds,
      user.userId,
      input,
    );
  }

  @Get('accounts/:id')
  @RequirePermissions('sales.orders.read')
  getAccount(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Param('id') id: string,
  ) {
    return this.openAccountsService.getAccount(
      context.organizationId,
      context.branchIds,
      id,
    );
  }

  @Patch('accounts/:id')
  @RequirePermissions('sales.orders.update')
  updateAccount(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: UpdateOpenAccountDto,
  ) {
    return this.openAccountsService.updateAccount(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('accounts/:id/items')
  @RequirePermissions('sales.orders.update')
  addItems(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: AddOpenAccountItemsDto,
  ) {
    return this.openAccountsService.addItems(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('accounts/:id/items/:itemId/cancel')
  @RequirePermissions('sales.orders.cancel_item')
  cancelAccountItem(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() input: CancelOpenAccountItemDto,
  ) {
    return this.openAccountsService.cancelAccountItem(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      itemId,
      input,
    );
  }

  @Post('accounts/:id/kitchen-tickets')
  @RequirePermissions('sales.orders.send_kitchen')
  sendKitchenTicket(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: SendKitchenTicketDto,
  ) {
    return this.openAccountsService.sendKitchenTicket(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Get('kitchen-tickets')
  @RequirePermissions('sales.kitchen.read')
  listKitchenTickets(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @Query('branchId') branchId?: string,
    @Query('status') status?: KitchenTicketStatus,
  ) {
    return this.openAccountsService.listKitchenTickets(
      context.organizationId,
      context.branchIds,
      branchId,
      status,
    );
  }

  @Patch('kitchen-tickets/:id')
  @RequirePermissions('sales.orders.update_kitchen')
  updateKitchenTicket(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: UpdateKitchenTicketDto,
  ) {
    return this.openAccountsService.updateKitchenTicket(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('accounts/:id/payments')
  @RequirePermissions('sales.orders.pay')
  recordPayment(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: RecordOpenAccountPaymentDto,
  ) {
    return this.openAccountsService.recordPayment(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }

  @Post('accounts/:id/cancel')
  @RequirePermissions('sales.orders.cancel')
  cancelAccount(
    @OrganizationContext() context: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: CancelOpenAccountDto,
  ) {
    return this.openAccountsService.cancelAccount(
      context.organizationId,
      context.branchIds,
      user.userId,
      id,
      input,
    );
  }
}
