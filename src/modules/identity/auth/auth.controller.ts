import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  applyAuthResponseHeaders,
  clearRefreshTokenCookie,
  extractRefreshTokenFromRequest,
  toPublicAuthSessionResponse,
  writeRefreshTokenCookie,
} from './auth-http.util';
import { ConsumerRegisterDto } from './dto/consumer-register.dto';
import { LegacyLoginDto } from './dto/legacy-login.dto';

// Alias temporal de compatibilidad mientras migramos los clientes
// desde /api/auth hacia /api/consumer/auth.
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: ConsumerRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    const session = await this.authService.registerConsumer(registerDto);
    writeRefreshTokenCookie(response, this.configService, session.refreshToken);

    return toPublicAuthSessionResponse(session);
  }

  @Post('login')
  async login(
    @Body() loginDto: LegacyLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    const session = await this.authService.loginLegacy(loginDto);
    writeRefreshTokenCookie(response, this.configService, session.refreshToken);

    return toPublicAuthSessionResponse(session);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    try {
      const refreshToken = extractRefreshTokenFromRequest(request);
      const session = await this.authService.refresh(refreshToken);

      writeRefreshTokenCookie(
        response,
        this.configService,
        session.refreshToken,
      );

      return toPublicAuthSessionResponse(session);
    } catch (error) {
      clearRefreshTokenCookie(response, this.configService);
      throw error;
    }
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    try {
      const refreshToken = extractRefreshTokenFromRequest(request);
      const result = await this.authService.logout(refreshToken);

      clearRefreshTokenCookie(response, this.configService);

      return result;
    } catch (error) {
      clearRefreshTokenCookie(response, this.configService);
      throw error;
    }
  }
}
