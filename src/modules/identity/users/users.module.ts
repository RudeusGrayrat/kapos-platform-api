import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../../../common/authorization/authorization.module';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { ConsumerUsersController } from './consumer-users.controller';
import { ErpAccessController } from './erp-access.controller';
import { OrganizationAdminService } from './organization-admin.service';
import { PlatformAdminService } from './platform-admin.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [UsersController, ConsumerUsersController, ErpAccessController],
  providers: [UsersService, PlatformAdminService, OrganizationAdminService],
  exports: [UsersService],
})
export class UsersModule {}
