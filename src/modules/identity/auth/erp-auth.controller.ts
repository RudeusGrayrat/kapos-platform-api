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
import { ErpLoginDto } from './dto/erp-login.dto';

@Controller('erp/auth')
export class ErpAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // En esta etapa el ERP autentica identidad solamente.
  // La autorizacion por organizacion, membership, roles y permisos se agregara despues.
  @Post('login')
  async login(
    @Body() loginDto: ErpLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    const session = await this.authService.loginLocal(loginDto);
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
