import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function parseCorsOrigins(origins: string): string[] {
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function buildCorsOptions(
  configService: Pick<ConfigService, 'getOrThrow'>,
): CorsOptions {
  const allowedOrigins = parseCorsOrigins(
    configService.getOrThrow<string>('FRONTEND_ORIGINS'),
  );

  return {
    origin(origin, callback) {
      // Herramientas locales como curl o algunos tests no envian Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
    },
    credentials: true,
  };
}
