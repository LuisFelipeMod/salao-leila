import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AppointmentServiceEntity, AppointmentServiceStatus } from './entities/appointment-service.entity';
import { ServicesService } from '../services/services.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeService = (overrides = {}) => ({
  id: 'svc-1',
  name: 'Corte',
  price: '80.00',
  durationMinutes: 60,
  ...overrides,
});

const makeAppointment = (overrides = {}): Partial<Appointment> => ({
  id: 'apt-1',
  userId: 'user-1',
  scheduledDate: '2099-12-01',
  scheduledTime: '10:00',
  totalDuration: 60,
  totalPrice: 80,
  status: AppointmentStatus.PENDING,
  notes: null,
  appointmentServices: [],
  ...overrides,
});

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentsRepo: ReturnType<typeof mockRepo>;
  let appointmentServicesRepo: ReturnType<typeof mockRepo>;
  let servicesService: jest.Mocked<ServicesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useFactory: mockRepo },
        { provide: getRepositoryToken(AppointmentServiceEntity), useFactory: mockRepo },
        {
          provide: ServicesService,
          useValue: { findByIds: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AppointmentsService);
    appointmentsRepo = module.get(getRepositoryToken(Appointment));
    appointmentServicesRepo = module.get(getRepositoryToken(AppointmentServiceEntity));
    servicesService = module.get(ServicesService);
  });

  // ── checkTimeConflict (tested via create) ────────────────────────────────

  describe('checkTimeConflict', () => {
    it('does not throw when no appointments exist on the date', async () => {
      appointmentsRepo.find.mockResolvedValue([]);
      await expect(
        service.checkTimeConflict('2099-12-01', '10:00', 60),
      ).resolves.toBeUndefined();
    });

    it('does not throw for adjacent slots (end of one = start of next)', async () => {
      // Existing: 08:00–09:00. New: 09:00–10:00. No overlap.
      appointmentsRepo.find.mockResolvedValue([
        { id: 'other', scheduledTime: '08:00', totalDuration: 60 },
      ]);
      await expect(
        service.checkTimeConflict('2099-12-01', '09:00', 60),
      ).resolves.toBeUndefined();
    });

    it('throws ConflictException for exact same time slot', async () => {
      appointmentsRepo.find.mockResolvedValue([
        { id: 'other', scheduledTime: '10:00', totalDuration: 60 },
      ]);
      await expect(
        service.checkTimeConflict('2099-12-01', '10:00', 60),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for partial overlap (new starts mid-existing)', async () => {
      // Existing: 10:00–11:00. New: 10:30–11:30.
      appointmentsRepo.find.mockResolvedValue([
        { id: 'other', scheduledTime: '10:00', totalDuration: 60 },
      ]);
      await expect(
        service.checkTimeConflict('2099-12-01', '10:30', 60),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when new appointment contains an existing one', async () => {
      // Existing: 10:30–11:00. New: 10:00–12:00.
      appointmentsRepo.find.mockResolvedValue([
        { id: 'other', scheduledTime: '10:30', totalDuration: 30 },
      ]);
      await expect(
        service.checkTimeConflict('2099-12-01', '10:00', 120),
      ).rejects.toThrow(ConflictException);
    });

    it('skips the excluded appointment id (update scenario)', async () => {
      // Self-appointment at same slot — should not conflict with itself
      appointmentsRepo.find.mockResolvedValue([]); // excludeId is passed to the query
      await expect(
        service.checkTimeConflict('2099-12-01', '10:00', 60, 'apt-1'),
      ).resolves.toBeUndefined();
    });
  });

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      scheduledDate: '2099-12-01',
      scheduledTime: '10:00',
      serviceIds: ['svc-1'],
    };

    beforeEach(() => {
      // No conflicts by default
      appointmentsRepo.find.mockResolvedValue([]);
      // No same-week appointment
      appointmentsRepo.findOne
        .mockResolvedValueOnce(null) // checkSameWeek
        .mockResolvedValueOnce({ // findById after save
          ...makeAppointment(),
          appointmentServices: [{ id: 'as-1', serviceId: 'svc-1', service: makeService(), status: AppointmentServiceStatus.PENDING, price: '80.00' }],
          user: { id: 'user-1', name: 'Ana', email: 'ana@test.com', phone: '11999' },
        });
      appointmentsRepo.create.mockReturnValue(makeAppointment());
      appointmentsRepo.save.mockResolvedValue(makeAppointment());
      appointmentServicesRepo.create.mockReturnValue({});
      appointmentServicesRepo.save.mockResolvedValue([]);
    });

    it('creates appointment and returns it', async () => {
      servicesService.findByIds.mockResolvedValue([makeService() as any]);

      const result = await service.create('user-1', dto);

      expect(result.appointment).toBeDefined();
      expect(appointmentsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ totalDuration: 60, totalPrice: 80 }),
      );
    });

    it('throws BadRequestException when a service is not found', async () => {
      servicesService.findByIds.mockResolvedValue([]); // 0 found, 1 expected

      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when time slot is taken', async () => {
      servicesService.findByIds.mockResolvedValue([makeService() as any]);
      appointmentsRepo.find.mockResolvedValue([
        { id: 'other', scheduledTime: '10:00', totalDuration: 60 },
      ]);

      await expect(service.create('user-1', dto)).rejects.toThrow(ConflictException);
    });

    it('returns week suggestion when same-week appointment exists', async () => {
      servicesService.findByIds.mockResolvedValue([makeService() as any]);
      const existing = makeAppointment({ id: 'older', scheduledDate: '2099-11-25' });

      // Reset to avoid stacking on top of the beforeEach queue
      appointmentsRepo.findOne.mockReset();
      appointmentsRepo.findOne
        .mockResolvedValueOnce(existing) // checkSameWeek → found
        .mockResolvedValueOnce({         // findById after save
          ...makeAppointment(),
          appointmentServices: [],
          user: {},
        });

      const result = await service.create('user-1', dto);

      expect(result.suggestion).toBeDefined();
      expect(result.suggestion?.message).toContain('semana');
    });
  });

  // ── updateByClient ────────────────────────────────────────────────────────

  describe('updateByClient', () => {
    const aptFarFuture = makeAppointment({ scheduledDate: '2099-12-30' }) as Appointment;

    it('throws ForbiddenException when user is not the owner', async () => {
      appointmentsRepo.findOne.mockResolvedValue({ ...aptFarFuture, userId: 'other-user' });

      await expect(
        service.updateByClient('apt-1', 'user-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when appointment is within 2 days', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      appointmentsRepo.findOne.mockResolvedValue({
        ...aptFarFuture,
        userId: 'user-1',
        scheduledDate: tomorrowStr,
      });

      await expect(
        service.updateByClient('apt-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── cancelByClient ────────────────────────────────────────────────────────

  describe('cancelByClient', () => {
    it('sets status to CANCELLED', async () => {
      const apt = { ...makeAppointment(), userId: 'user-1' };
      appointmentsRepo.findOne.mockResolvedValue(apt);
      appointmentsRepo.save.mockResolvedValue({ ...apt, status: AppointmentStatus.CANCELLED });

      await service.cancelByClient('apt-1', 'user-1');

      expect(appointmentsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.CANCELLED }),
      );
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      appointmentsRepo.findOne.mockResolvedValue({ ...makeAppointment(), userId: 'other' });

      await expect(service.cancelByClient('apt-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── confirmByAdmin ────────────────────────────────────────────────────────

  describe('confirmByAdmin', () => {
    it('sets status to CONFIRMED', async () => {
      const apt = makeAppointment();
      appointmentsRepo.findOne.mockResolvedValue(apt);
      appointmentsRepo.save.mockResolvedValue({ ...apt, status: AppointmentStatus.CONFIRMED });

      await service.confirmByAdmin('apt-1');

      expect(appointmentsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.CONFIRMED }),
      );
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('throws NotFoundException when appointment does not exist', async () => {
      appointmentsRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── checkSameWeek ─────────────────────────────────────────────────────────

  describe('checkSameWeek', () => {
    it('returns null when no appointment exists in the week', async () => {
      appointmentsRepo.findOne.mockResolvedValue(null);

      const result = await service.checkSameWeek('user-1', '2099-12-01');
      expect(result).toBeNull();
    });

    it('returns suggestion object when appointment exists in the week', async () => {
      const existing = makeAppointment({ id: 'older' });
      appointmentsRepo.findOne.mockResolvedValue(existing);

      const result = await service.checkSameWeek('user-1', '2099-12-01');
      expect(result?.message).toContain('semana');
      expect(result?.existingAppointment).toBe(existing);
    });
  });

  // ── updateServiceStatus ───────────────────────────────────────────────────

  describe('updateServiceStatus', () => {
    it('updates status of appointment service item', async () => {
      const item = { id: 'as-1', status: AppointmentServiceStatus.PENDING };
      appointmentServicesRepo.findOne.mockResolvedValue(item);
      appointmentServicesRepo.save.mockResolvedValue({ ...item, status: AppointmentServiceStatus.COMPLETED });

      await service.updateServiceStatus('apt-1', 'as-1', AppointmentServiceStatus.COMPLETED);

      expect(appointmentServicesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentServiceStatus.COMPLETED }),
      );
    });

    it('throws NotFoundException when item does not belong to appointment', async () => {
      appointmentServicesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateServiceStatus('apt-1', 'wrong-id', AppointmentServiceStatus.COMPLETED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
