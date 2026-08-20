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
import { ConsumerLoginDto } from './dto/consumer-login.dto';
import { ConsumerRegisterDto } from './dto/consumer-register.dto';

@Controller('consumer/auth')
export class ConsumerAuthController {
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
    @Body() loginDto: ConsumerLoginDto,
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
