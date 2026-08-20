import { Controller, Get, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { AuthController } from '../src/modules/identity/auth/auth.controller';
import { AuthService } from '../src/modules/identity/auth/auth.service';
import { ConsumerAuthController } from '../src/modules/identity/auth/consumer-auth.controller';
import { ErpAuthController } from '../src/modules/identity/auth/erp-auth.controller';

@Controller()
class TestHealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'basti-backend',
    };
  }
}

@Module({
  controllers: [
    TestHealthController,
    AuthController,
    ConsumerAuthController,
    ErpAuthController,
  ],
  providers: [
    {
      provide: AuthService,
      useValue: {
        registerConsumer: jest.fn(),
        loginLegacy: jest.fn(),
        loginLocal: jest.fn(),
        refresh: jest.fn(),
        logout: jest.fn(),
      },
    },
    {
      provide: ConfigService,
      useValue: {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') {
            return 'test';
          }

          return undefined;
        }),
        getOrThrow: jest.fn((key: string) => {
          const config: Record<string, string> = {
            FRONTEND_ORIGINS: 'http://localhost:3001,http://localhost:3002',
            JWT_REFRESH_EXPIRES_IN: '7d',
          };

          return config[key];
        }),
      },
    },
  ],
})
class TestAppModule {}

describe('Auth HTTP cookies (e2e)', () => {
  let app: INestApplication;
  let authService: {
    registerConsumer: jest.Mock;
    loginLegacy: jest.Mock;
    loginLocal: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleFixture.get(AuthService);
    jest.clearAllMocks();
  });

  it('keeps the health endpoint working', () => {
    return request(app.getHttpServer()).get('/api').expect(200).expect({
      status: 'ok',
      service: 'basti-backend',
    });
  });

  it('registers through consumer auth, returns access token in JSON and refresh token in an HTTP-only cookie', async () => {
    authService.registerConsumer.mockResolvedValue({
      user: { id: 'consumer-1', email: 'consumer@basti.dev' },
      accessToken: 'consumer-access-token',
      refreshToken: 'consumer-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/consumer/auth/register')
      .set('Origin', 'http://localhost:3001')
      .send({
        email: 'consumer@basti.dev',
        password: 'StrongPass123!',
      })
      .expect(201);

    expect(response.body).toEqual({
      user: { id: 'consumer-1', email: 'consumer@basti.dev' },
      accessToken: 'consumer-access-token',
    });
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3001',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('basti_refresh_token=consumer-refresh-token'),
      ]),
    );
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect(response.headers['set-cookie'][0]).toContain('Path=/api');
  });

  it('logs in through erp auth and sets the same refresh-cookie mechanism', async () => {
    authService.loginLocal.mockResolvedValue({
      user: { id: 'worker-1', email: 'worker@basti.dev' },
      accessToken: 'erp-access-token',
      refreshToken: 'erp-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/erp/auth/login')
      .send({
        identifier: 'worker@basti.dev',
        password: 'StrongPass123!',
      })
      .expect(201);

    expect(response.body).toEqual({
      user: { id: 'worker-1', email: 'worker@basti.dev' },
      accessToken: 'erp-access-token',
    });
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie'][0]).toContain(
      'basti_refresh_token=erp-refresh-token',
    );
  });

  it('rotates the refresh token from the cookie on consumer refresh', async () => {
    authService.refresh.mockResolvedValue({
      user: { id: 'consumer-1', email: 'consumer@basti.dev' },
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/consumer/auth/refresh')
      .set('Cookie', 'basti_refresh_token=previous-refresh-token')
      .expect(201);

    expect(authService.refresh).toHaveBeenCalledWith('previous-refresh-token');
    expect(response.body).toEqual({
      user: { id: 'consumer-1', email: 'consumer@basti.dev' },
      accessToken: 'rotated-access-token',
    });
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie'][0]).toContain(
      'basti_refresh_token=rotated-refresh-token',
    );
  });

  it('refreshes through the legacy alias using the same cookie mechanism', async () => {
    authService.refresh.mockResolvedValue({
      user: { id: 'legacy-1', email: 'legacy@basti.dev' },
      accessToken: 'legacy-access-token',
      refreshToken: 'legacy-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', 'basti_refresh_token=legacy-cookie-token')
      .expect(201);

    expect(authService.refresh).toHaveBeenCalledWith('legacy-cookie-token');
    expect(response.body).toEqual({
      user: { id: 'legacy-1', email: 'legacy@basti.dev' },
      accessToken: 'legacy-access-token',
    });
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toContain(
      'basti_refresh_token=legacy-refresh-token',
    );
  });

  it('logs out through consumer auth, revokes the session and clears the cookie', async () => {
    authService.logout.mockResolvedValue({
      message: 'Session closed successfully.',
    });

    const response = await request(app.getHttpServer())
      .post('/api/consumer/auth/logout')
      .set('Cookie', 'basti_refresh_token=logout-token')
      .expect(201);

    expect(authService.logout).toHaveBeenCalledWith('logout-token');
    expect(response.body).toEqual({
      message: 'Session closed successfully.',
    });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie'][0]).toContain('basti_refresh_token=');
    expect(response.headers['set-cookie'][0]).toContain('Path=/api');
  });

  afterEach(async () => {
    await app.close();
  });
});
