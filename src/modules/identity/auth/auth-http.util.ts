import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, CookieOptions } from 'express';

const REFRESH_COOKIE_NAME = 'basti_refresh_token';
const REFRESH_COOKIE_PATH = '/api';
const NO_STORE_HEADER_VALUE = 'no-store';

type ConfigLike = Pick<ConfigService, 'get' | 'getOrThrow'>;

type AuthSessionResponse<TUser> = {
  user: TUser;
  accessToken: string;
  refreshToken: string;
};

type PublicAuthSessionResponse<TUser> = {
  user: TUser;
  accessToken: string;
};

export function applyAuthResponseHeaders(response: Response): void {
  response.setHeader('Cache-Control', NO_STORE_HEADER_VALUE);
}

export function writeRefreshTokenCookie(
  response: Response,
  configService: ConfigLike,
  refreshToken: string,
): void {
  response.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    getRefreshCookieOptions(configService),
  );
}

export function clearRefreshTokenCookie(
  response: Response,
  configService: ConfigLike,
): void {
  response.clearCookie(
    REFRESH_COOKIE_NAME,
    getRefreshCookieBaseOptions(configService),
  );
}

export function extractRefreshTokenFromRequest(request: Request): string {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    throwUnauthorized();
  }

  const parsedCookies = parseCookieHeader(cookieHeader);
  const refreshToken = parsedCookies.get(REFRESH_COOKIE_NAME);

  if (!refreshToken) {
    throwUnauthorized();
  }

  return refreshToken;
}

export function toPublicAuthSessionResponse<TUser>(
  sessionResponse: AuthSessionResponse<TUser>,
): PublicAuthSessionResponse<TUser> {
  const { refreshToken: _refreshToken, ...publicResponse } = sessionResponse;

  return publicResponse;
}

export function toMobileAuthSessionResponse<TUser>(
  sessionResponse: AuthSessionResponse<TUser>,
): AuthSessionResponse<TUser> {
  return sessionResponse;
}

export function getRefreshCookieName(): string {
  return REFRESH_COOKIE_NAME;
}

function getRefreshCookieOptions(configService: ConfigLike): CookieOptions {
  return {
    ...getRefreshCookieBaseOptions(configService),
    maxAge: parseDurationToMilliseconds(
      configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    ),
  };
}

function getRefreshCookieBaseOptions(configService: ConfigLike): CookieOptions {
  return {
    httpOnly: true,
    secure: isProductionEnvironment(configService),
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  };
}

function isProductionEnvironment(configService: ConfigLike): boolean {
  const environment =
    configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';

  return environment === 'production';
}

function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookieEntries = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex === -1) {
        return null;
      }

      const name = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      return [name, decodeURIComponent(value)] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  return new Map(cookieEntries);
}

function parseDurationToMilliseconds(duration: string): number {
  const parsedDuration = /^(\d+)(ms|s|m|h|d|w|y)$/.exec(duration.trim());

  if (!parsedDuration) {
    throw new Error(
      `JWT_REFRESH_EXPIRES_IN value "${duration}" is not supported for cookie maxAge.`,
    );
  }

  const [, rawAmount, unit] = parsedDuration;
  const amount = Number.parseInt(rawAmount, 10);

  const unitToMilliseconds: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
    y: 31_536_000_000,
  };

  return amount * unitToMilliseconds[unit];
}

function throwUnauthorized(): never {
  throw new UnauthorizedException('Unauthorized.');
}
