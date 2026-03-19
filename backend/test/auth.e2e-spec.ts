import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const JWT_SECRET = 'test-secret';

// Set env before JwtStrategy is instantiated
process.env.JWT_SECRET = JWT_SECRET;

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1d' } }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        JwtStrategy,
      ],
    })
      .overrideProvider('JWT_SECRET')
      .useValue(JWT_SECRET)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => jest.resetAllMocks());

  // ── POST /api/auth/register ───────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    const validBody = {
      name: 'Ana Lima',
      email: 'ana@test.com',
      phone: '11999999999',
      password: 'senha123',
    };

    it('returns 201 with token on success', async () => {
      mockAuthService.register.mockResolvedValue({
        access_token: 'jwt-token',
        user: { id: 'u1', name: 'Ana Lima', email: 'ana@test.com', role: 'CLIENT' },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      expect(res.body.data.access_token).toBe('jwt-token');
    });

    it('returns 409 when email is already registered', async () => {
      mockAuthService.register.mockRejectedValue(new ConflictException('E-mail já cadastrado'));

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validBody)
        .expect(409);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'ana@test.com' }) // missing name, phone, password
        .expect(400);
    });

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400);
    });
  });

  // ── POST /api/auth/login ──────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns 201 with token on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        access_token: 'jwt-token',
        user: { id: 'u1', name: 'Ana', email: 'ana@test.com', role: 'CLIENT' },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ana@test.com', password: 'senha123' })
        .expect(201);

      expect(res.body.data.access_token).toBeDefined();
    });

    it('returns 401 on invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('E-mail ou senha inválidos'));

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ana@test.com', password: 'errada' })
        .expect(401);
    });

    it('returns 400 when body is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '123' }) // password too short
        .expect(400);
    });
  });

  // ── GET /api/auth/me ──────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('returns 401 without Authorization header', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
