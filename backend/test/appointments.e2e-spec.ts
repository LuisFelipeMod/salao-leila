import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AppointmentStatus } from '../src/appointments/entities/appointment.entity';
import { AppointmentServiceStatus } from '../src/appointments/entities/appointment-service.entity';

const JWT_SECRET = 'test-secret';

// Set env before JwtStrategy is instantiated
process.env.JWT_SECRET = JWT_SECRET;

const mockAppointmentsService = {
  create: jest.fn(),
  findMyAppointments: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  updateByClient: jest.fn(),
  cancelByClient: jest.fn(),
  confirmByAdmin: jest.fn(),
  adminUpdate: jest.fn(),
  updateServiceStatus: jest.fn(),
  checkWeekEndpoint: jest.fn(),
};

const makeApt = (overrides = {}) => ({
  id: 'apt-uuid',
  userId: 'client-uuid',
  scheduledDate: '2099-12-01',
  scheduledTime: '10:00',
  status: AppointmentStatus.PENDING,
  totalPrice: '80.00',
  totalDuration: 60,
  notes: null,
  appointmentServices: [],
  ...overrides,
});

describe('Appointments (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  let clientToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1d' } }),
      ],
      controllers: [AppointmentsController],
      providers: [
        { provide: AppointmentsService, useValue: mockAppointmentsService },
        JwtStrategy,
        RolesGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    jwtService = module.get(JwtService);
    clientToken = jwtService.sign({ sub: 'client-uuid', email: 'client@test.com', role: 'CLIENT' });
    adminToken = jwtService.sign({ sub: 'admin-uuid', email: 'admin@test.com', role: 'ADMIN' });
  });

  afterAll(() => app.close());
  beforeEach(() => jest.resetAllMocks());

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  // ── POST /api/appointments ────────────────────────────────────────────────

  describe('POST /api/appointments', () => {
    const validBody = {
      scheduledDate: '2099-12-01',
      scheduledTime: '10:00',
      serviceIds: ['550e8400-e29b-41d4-a716-446655440000'],
    };

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).post('/api/appointments').send(validBody).expect(401);
    });

    it('returns 201 on success', async () => {
      mockAppointmentsService.create.mockResolvedValue({ appointment: makeApt() });

      const res = await request(app.getHttpServer())
        .post('/api/appointments')
        .set(auth(clientToken))
        .send(validBody)
        .expect(201);

      expect(res.body.data.appointment.id).toBe('apt-uuid');
    });

    it('returns 409 when time slot is already taken', async () => {
      mockAppointmentsService.create.mockRejectedValue(
        new ConflictException('Horário indisponível'),
      );

      await request(app.getHttpServer())
        .post('/api/appointments')
        .set(auth(clientToken))
        .send(validBody)
        .expect(409);
    });

    it('returns 400 when serviceIds is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set(auth(clientToken))
        .send({ ...validBody, serviceIds: [] })
        .expect(400);
    });

    it('returns 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set(auth(clientToken))
        .send({ ...validBody, scheduledDate: 'not-a-date' })
        .expect(400);
    });
  });

  // ── GET /api/appointments/my ──────────────────────────────────────────────

  describe('GET /api/appointments/my', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/appointments/my').expect(401);
    });

    it('returns paginated appointments', async () => {
      mockAppointmentsService.findMyAppointments.mockResolvedValue({
        data: [makeApt()],
        total: 1,
        page: 1,
        lastPage: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/api/appointments/my')
        .set(auth(clientToken))
        .expect(200);

      expect(res.body.data.data).toHaveLength(1);
    });
  });

  // ── GET /api/appointments (admin only) ────────────────────────────────────

  describe('GET /api/appointments', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/appointments').expect(401);
    });

    it('returns 403 for client role', async () => {
      await request(app.getHttpServer())
        .get('/api/appointments')
        .set(auth(clientToken))
        .expect(403);
    });

    it('returns 200 for admin', async () => {
      mockAppointmentsService.findAll.mockResolvedValue({
        data: [makeApt()],
        total: 1,
        page: 1,
        lastPage: 1,
      });

      await request(app.getHttpServer())
        .get('/api/appointments')
        .set(auth(adminToken))
        .expect(200);
    });
  });

  // ── GET /api/appointments/:id ─────────────────────────────────────────────

  describe('GET /api/appointments/:id', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 404 when not found', async () => {
      mockAppointmentsService.findById.mockRejectedValue(
        new NotFoundException('Agendamento não encontrado'),
      );

      await request(app.getHttpServer())
        .get(`/api/appointments/${validId}`)
        .set(auth(clientToken))
        .expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/appointments/not-a-uuid')
        .set(auth(clientToken))
        .expect(400);
    });

    it('returns the appointment', async () => {
      mockAppointmentsService.findById.mockResolvedValue(makeApt());

      const res = await request(app.getHttpServer())
        .get(`/api/appointments/${validId}`)
        .set(auth(clientToken))
        .expect(200);

      expect(res.body.data.id).toBe('apt-uuid');
    });
  });

  // ── DELETE /api/appointments/:id ──────────────────────────────────────────

  describe('DELETE /api/appointments/:id', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 200 on cancel', async () => {
      mockAppointmentsService.cancelByClient.mockResolvedValue(
        makeApt({ status: AppointmentStatus.CANCELLED }),
      );

      await request(app.getHttpServer())
        .delete(`/api/appointments/${validId}`)
        .set(auth(clientToken))
        .expect(200);
    });

    it('returns 403 when not owner', async () => {
      mockAppointmentsService.cancelByClient.mockRejectedValue(
        new ForbiddenException('Sem permissão'),
      );

      await request(app.getHttpServer())
        .delete(`/api/appointments/${validId}`)
        .set(auth(clientToken))
        .expect(403);
    });
  });

  // ── PATCH /api/appointments/:id ───────────────────────────────────────────

  describe('PATCH /api/appointments/:id', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 400 when within 2-day rule', async () => {
      mockAppointmentsService.updateByClient.mockRejectedValue(
        new BadRequestException('Menos de 2 dias'),
      );

      await request(app.getHttpServer())
        .patch(`/api/appointments/${validId}`)
        .set(auth(clientToken))
        .send({ scheduledTime: '11:00' })
        .expect(400);
    });

    it('returns 409 on time conflict', async () => {
      mockAppointmentsService.updateByClient.mockRejectedValue(
        new ConflictException('Horário indisponível'),
      );

      await request(app.getHttpServer())
        .patch(`/api/appointments/${validId}`)
        .set(auth(clientToken))
        .send({ scheduledTime: '11:00' })
        .expect(409);
    });
  });

  // ── PATCH /api/appointments/:id/confirm (admin) ───────────────────────────

  describe('PATCH /api/appointments/:id/confirm', () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';

    it('returns 403 for client role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/appointments/${validId}/confirm`)
        .set(auth(clientToken))
        .expect(403);
    });

    it('returns 200 for admin', async () => {
      mockAppointmentsService.confirmByAdmin.mockResolvedValue(
        makeApt({ status: AppointmentStatus.CONFIRMED }),
      );

      await request(app.getHttpServer())
        .patch(`/api/appointments/${validId}/confirm`)
        .set(auth(adminToken))
        .expect(200);
    });
  });

  // ── PATCH /api/appointments/:id/services/:serviceId (admin) ──────────────

  describe('PATCH /api/appointments/:id/services/:serviceId', () => {
    const aptId = '550e8400-e29b-41d4-a716-446655440000';
    const svcId = '550e8400-e29b-41d4-a716-446655440001';

    it('returns 403 for client role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/appointments/${aptId}/services/${svcId}`)
        .set(auth(clientToken))
        .send({ status: AppointmentServiceStatus.COMPLETED })
        .expect(403);
    });

    it('returns 404 when service item not found', async () => {
      mockAppointmentsService.updateServiceStatus.mockRejectedValue(
        new NotFoundException('Serviço não encontrado neste agendamento'),
      );

      await request(app.getHttpServer())
        .patch(`/api/appointments/${aptId}/services/${svcId}`)
        .set(auth(adminToken))
        .send({ status: AppointmentServiceStatus.COMPLETED })
        .expect(404);
    });

    it('returns 200 on success', async () => {
      mockAppointmentsService.updateServiceStatus.mockResolvedValue({
        id: svcId,
        status: AppointmentServiceStatus.COMPLETED,
      });

      await request(app.getHttpServer())
        .patch(`/api/appointments/${aptId}/services/${svcId}`)
        .set(auth(adminToken))
        .send({ status: AppointmentServiceStatus.COMPLETED })
        .expect(200);
    });
  });
});
