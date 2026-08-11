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
import { CashService } from './cash.service';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('registers')
  @RequirePermissions('cash.openings.read')
  listRegisters(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.cashService.listRegisters(organizationContext.organizationId);
  }

  @Post('registers')
  @RequirePermissions('cash.openings.create')
  createRegister(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Body() input: CreateCashRegisterDto,
  ) {
    return this.cashService.createRegister(
      organizationContext.organizationId,
      input,
    );
  }

  @Patch('registers/:id')
  @RequirePermissions('cash.openings.update')
  updateRegister(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdateCashRegisterDto,
  ) {
    return this.cashService.updateRegister(
      organizationContext.organizationId,
      id,
      input,
    );
  }

  @Get('sessions')
  @RequirePermissions('cash.openings.read')
  listSessions(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'OPEN' | 'CLOSED' | 'CANCELLED',
  ) {
    return this.cashService.listSessions({
      organizationId: organizationContext.organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
    });
  }

  @Get('sessions/open')
  @RequirePermissions('cash.openings.read')
  getOpenSession(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Query('cashRegisterId') cashRegisterId?: string,
  ) {
    return this.cashService.getOpenSession(
      organizationContext.organizationId,
      cashRegisterId,
    );
  }

  @Post('sessions/open')
  @RequirePermissions('cash.openings.create')
  openSession(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Body() input: OpenCashSessionDto,
  ) {
    return this.cashService.openSession(
      organizationContext.organizationId,
      user.userId,
      input,
    );
  }

  @Get('sessions/:id/movements')
  @RequirePermissions('cash.movements.read')
  listMovements(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
  ) {
    return this.cashService.listMovements(
      organizationContext.organizationId,
      id,
    );
  }

  @Post('sessions/:id/movements')
  @RequirePermissions('cash.movements.create')
  createMovement(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: CreateCashMovementDto,
  ) {
    return this.cashService.createMovement(
      organizationContext.organizationId,
      user.userId,
      id,
      input,
    );
  }

  @Post('sessions/:id/close')
  @RequirePermissions('cash.closings.create')
  closeSession(
    @OrganizationContext() organizationContext: OrganizationAuthorizationContext,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() input: CloseCashSessionDto,
  ) {
    return this.cashService.closeSession(
      organizationContext.organizationId,
      user.userId,
      id,
      input,
    );
  }
}
