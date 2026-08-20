import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request, Response } from 'express';
import { AuthController } from './auth/auth.controller';
import { getRefreshCookieName } from './auth/auth-http.util';
import { ConsumerAuthController } from './auth/consumer-auth.controller';
import { ErpAuthController } from './auth/erp-auth.controller';
import { ConsumerRegisterDto } from './auth/dto/consumer-register.dto';
import { LegacyLoginDto } from './auth/dto/legacy-login.dto';
import { ConsumerUsersController } from './users/consumer-users.controller';
import { UpdateConsumerUserDto } from './users/dto/update-consumer-user.dto';
import { UsersController } from './users/users.controller';

describe('Identity compatibility and validation', () => {
  const authService = {
    registerConsumer: jest.fn(),
    loginLegacy: jest.fn(),
    loginLocal: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') {
        return 'development';
      }

      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_EXPIRES_IN') {
        return '7d';
      }

      throw new Error(`Unexpected config lookup: ${key}`);
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects consumer registration without email', () => {
    const dto = plainToInstance(ConsumerRegisterDto, {
      password: 'StrongPass123!',
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('rejects protected profile fields through the global validation pipe', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    await expect(
      pipe.transform(
        {
          firstName: 'Juan',
          status: 'ACTIVE',
        },
        {
          type: 'body',
          metatype: UpdateConsumerUserDto,
        },
      ),
    ).rejects.toThrow();
  });

  it('allows legacy auth controller to delegate without duplicating logic and omits refreshToken from JSON', async () => {
    const controller = new AuthController(
      authService as never,
      configService as never,
    );
    const response = createResponseMock();
    const dto: LegacyLoginDto = {
      email: 'legacy@basti.dev',
      password: 'StrongPass123!',
    };

    authService.loginLegacy.mockResolvedValue({
      user: { id: 'user-1' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await controller.login(dto, response as never);

    expect(authService.loginLegacy).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      getRefreshCookieName(),
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api',
        secure: false,
      }),
    );
    expect(result).toEqual({
      user: { id: 'user-1' },
      accessToken: 'access-token',
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('allows consumer auth controller to delegate to shared auth service and read refresh token from cookie', async () => {
    const controller = new ConsumerAuthController(
      authService as never,
      configService as never,
    );
    const request = {
      headers: {
        cookie: `${getRefreshCookieName()}=refresh-cookie-token`,
      },
    } as Request;
    const response = createResponseMock();

    authService.refresh.mockResolvedValue({
      user: { id: 'user-2' },
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });

    const result = await controller.refresh(request, response as never);

    expect(authService.refresh).toHaveBeenCalledWith('refresh-cookie-token');
    expect(response.cookie).toHaveBeenCalledWith(
      getRefreshCookieName(),
      'next-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api',
      }),
    );
    expect(result).toEqual({
      user: { id: 'user-2' },
      accessToken: 'next-access-token',
    });
  });

  it('returns a generic 401 when the refresh cookie is missing', async () => {
    const controller = new ConsumerAuthController(
      authService as never,
      configService as never,
    );
    const request = {
      headers: {},
    } as Request;
    const response = createResponseMock();

    await expect(
      controller.refresh(request, response as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(response.clearCookie).toHaveBeenCalledWith(
      getRefreshCookieName(),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api',
      }),
    );
  });

  it('allows erp auth controller to delegate logout to the shared auth service and clear the cookie', async () => {
    const controller = new ErpAuthController(
      authService as never,
      configService as never,
    );
    const request = {
      headers: {
        cookie: `${getRefreshCookieName()}=erp-refresh-token`,
      },
    } as Request;
    const response = createResponseMock();

    authService.logout.mockResolvedValue({
      message: 'Session closed successfully.',
    });

    const result = await controller.logout(request, response as never);

    expect(authService.logout).toHaveBeenCalledWith('erp-refresh-token');
    expect(response.clearCookie).toHaveBeenCalledWith(
      getRefreshCookieName(),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api',
      }),
    );
    expect(result).toEqual({
      message: 'Session closed successfully.',
    });
  });

  it('keeps legacy and consumer profile routes delegated to the same users service', () => {
    const usersService = {
      getCurrentUser: jest.fn(),
      updateCurrentUser: jest.fn(),
    };

    const legacyController = new UsersController(usersService as never);
    const consumerController = new ConsumerUsersController(
      usersService as never,
    );
    const dto = { firstName: 'Juan' };

    legacyController.updateMe({ userId: 'user-1' }, dto);
    consumerController.updateMe({ userId: 'user-1' }, dto);

    expect(usersService.updateCurrentUser).toHaveBeenNthCalledWith(
      1,
      'user-1',
      dto,
    );
    expect(usersService.updateCurrentUser).toHaveBeenNthCalledWith(
      2,
      'user-1',
      dto,
    );
  });
});

function createResponseMock(): Pick<
  Response,
  'cookie' | 'clearCookie' | 'setHeader'
> {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
  };
}
