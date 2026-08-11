import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildCorsOptions } from './config/cors.config';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  // Estas opciones endurecen la API desde el primer dia:
  // - whitelist: elimina campos no declarados en los DTO
  // - forbidNonWhitelisted: rechaza payloads "sucios"
  // - transform: convierte payloads a instancias de DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors(buildCorsOptions(configService));
  app.setGlobalPrefix('api');
}
