import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const startedAt = performance.now();
    const requestPath = request.originalUrl || request.url;
    const clientIp = request.ip || request.socket.remoteAddress || 'unknown-ip';

    response.on('finish', () => {
      const durationMs = Math.round(performance.now() - startedAt);

      this.logger.log(
        `${request.method} ${requestPath} ${response.statusCode} ${durationMs}ms ip=${clientIp}`,
      );
    });

    next();
  }
}
