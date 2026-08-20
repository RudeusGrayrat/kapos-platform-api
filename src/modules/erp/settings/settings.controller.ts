import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { OrganizationAuthorizationContext } from '../../../common/authorization/authorization.service';
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { SettingsService } from './settings.service';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('organization')
  @RequirePermissions('settings.organization.read')
  getOrganization(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.settingsService.getOrganizationProfile(
      organizationContext.organizationId,
    );
  }

  @Patch('organization')
  @RequirePermissions('settings.organization.update')
  updateOrganization(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: UpdateOrganizationProfileDto,
  ) {
    return this.settingsService.updateOrganizationProfile(
      organizationContext.organizationId,
      input,
    );
  }

  @Get('branches')
  @RequirePermissions('settings.branches.read')
  listBranches(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.settingsService.listBranches(
      organizationContext.organizationId,
    );
  }

  @Post('branches')
  @RequirePermissions('settings.branches.create')
  createBranch(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: CreateBranchDto,
  ) {
    return this.settingsService.createBranch(
      organizationContext.organizationId,
      input,
    );
  }

  @Patch('branches/:id')
  @RequirePermissions('settings.branches.update')
  updateBranch(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdateBranchDto,
  ) {
    return this.settingsService.updateBranch(
      organizationContext.organizationId,
      id,
      input,
    );
  }

  @Get('payment-methods')
  @RequirePermissions('settings.payment_methods.read')
  listPaymentMethods(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
  ) {
    return this.settingsService.listPaymentMethods(
      organizationContext.organizationId,
    );
  }

  @Post('payment-methods')
  @RequirePermissions('settings.payment_methods.create')
  createPaymentMethod(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: CreatePaymentMethodDto,
  ) {
    return this.settingsService.createPaymentMethod(
      organizationContext.organizationId,
      input,
    );
  }

  @Patch('payment-methods/:id')
  @RequirePermissions('settings.payment_methods.update')
  updatePaymentMethod(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
    @Body() input: UpdatePaymentMethodDto,
  ) {
    return this.settingsService.updatePaymentMethod(
      organizationContext.organizationId,
      id,
      input,
    );
  }

  @Delete('payment-methods/:id')
  @RequirePermissions('settings.payment_methods.delete')
  deletePaymentMethod(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('id') id: string,
  ) {
    return this.settingsService.deletePaymentMethod(
      organizationContext.organizationId,
      id,
    );
  }
}
