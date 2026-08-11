import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthorizationModule } from './common/authorization/authorization.module';
import { HttpLoggingMiddleware } from './common/middleware/http-logging.middleware';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { IdentityModule } from './modules/identity/identity.module';
import { ErpModule } from './modules/erp/erp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    AuthorizationModule,
    IdentityModule,
    ErpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
