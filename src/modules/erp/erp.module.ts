import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../../common/authorization/authorization.module';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';
import { CashController } from './cash/cash.controller';
import { CashService } from './cash/cash.service';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { SalesController } from './sales/sales.controller';
import { SalesService } from './sales/sales.service';
import { SettingsController } from './settings/settings.controller';
import { SettingsService } from './settings/settings.service';
import { DiningSpacesService } from './restaurant/dining-spaces.service';
import { OpenAccountsService } from './restaurant/open-accounts.service';
import { RestaurantController } from './restaurant/restaurant.controller';

@Module({
  imports: [AuthorizationModule, PrismaModule],
  controllers: [
    SettingsController,
    CatalogController,
    CashController,
    SalesController,
    CustomersController,
    PaymentsController,
    BillingController,
    RestaurantController,
  ],
  providers: [
    SettingsService,
    CatalogService,
    CashService,
    SalesService,
    CustomersService,
    PaymentsService,
    BillingService,
    DiningSpacesService,
    OpenAccountsService,
  ],
})
export class ErpModule {}
