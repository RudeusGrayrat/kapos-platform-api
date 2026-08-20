import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  applyAuthResponseHeaders,
  toMobileAuthSessionResponse,
} from './auth-http.util';
import { ErpLoginDto } from './dto/erp-login.dto';
import { MobileRefreshTokenDto } from './dto/mobile-refresh-token.dto';

@Controller('mobile/auth')
export class MobileAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: ErpLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    const session = await this.authService.loginLocal(loginDto);

    return toMobileAuthSessionResponse(session);
  }

  @Post('refresh')
  async refresh(
    @Body() input: MobileRefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    const session = await this.authService.refresh(input.refreshToken);

    return toMobileAuthSessionResponse(session);
  }

  @Post('logout')
  async logout(
    @Body() input: MobileRefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    applyAuthResponseHeaders(response);

    return this.authService.logout(input.refreshToken);
  }
}
