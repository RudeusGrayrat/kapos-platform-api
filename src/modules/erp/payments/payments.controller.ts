import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { OrganizationAuthorizationContext } from '../../../common/authorization/authorization.service';
import { OrganizationContext } from '../../../common/decorators/organization-context.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrganizationContextGuard } from '../../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { ConfirmPaymentIntentDto } from './dto/confirm-payment-intent.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@Controller('erp/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  @RequirePermissions('sales.pos.create')
  createIntent(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Body() input: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createIntent(
      organizationContext.organizationId,
      input,
    );
  }

  @Post('intents/:id/confirm')
  @RequirePermissions('sales.pos.create')
  confirmIntent(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('id') paymentIntentId: string,
    @Body() input: ConfirmPaymentIntentDto,
  ) {
    return this.paymentsService.confirmIntent(
      organizationContext.organizationId,
      paymentIntentId,
      input,
    );
  }

  @Post('intents/:id/fail')
  @RequirePermissions('sales.pos.create')
  failIntent(
    @OrganizationContext()
    organizationContext: OrganizationAuthorizationContext,
    @Param('id') paymentIntentId: string,
    @Body() input: ConfirmPaymentIntentDto,
  ) {
    return this.paymentsService.failIntent(
      organizationContext.organizationId,
      paymentIntentId,
      input,
    );
  }
}
