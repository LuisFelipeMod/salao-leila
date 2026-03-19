import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { paginate } from '../common/utils/pagination';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AppointmentServiceEntity, AppointmentServiceStatus } from './entities/appointment-service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ServicesService } from '../services/services.service';
import { Service } from '../services/entities/service.entity';

dayjs.extend(isoWeek);

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentServiceEntity)
    private appointmentServicesRepository: Repository<AppointmentServiceEntity>,
    private servicesService: ServicesService,
  ) {}

  async create(userId: string, dto: CreateAppointmentDto) {
    const services = await this.servicesService.findByIds(dto.serviceIds);
    if (services.length !== dto.serviceIds.length) {
      throw new BadRequestException('Um ou mais serviços não foram encontrados ou estão inativos');
    }

    const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);

    await this.checkTimeConflict(dto.scheduledDate, dto.scheduledTime, totalDuration);

    const weekSuggestion = await this.checkSameWeek(userId, dto.scheduledDate);

    const appointment = this.appointmentsRepository.create({
      userId,
      scheduledDate: dto.scheduledDate,
      scheduledTime: dto.scheduledTime,
      notes: dto.notes || null,
      totalPrice,
      totalDuration,
      status: AppointmentStatus.PENDING,
    });

    const saved = await this.appointmentsRepository.save(appointment);

    const appointmentServices = services.map((service) =>
      this.appointmentServicesRepository.create({
        appointmentId: saved.id,
        serviceId: service.id,
        price: service.price,
        status: AppointmentServiceStatus.PENDING,
      }),
    );

    await this.appointmentServicesRepository.save(appointmentServices);

    const result = await this.findById(saved.id);

    return {
      appointment: result,
      ...(weekSuggestion ? { suggestion: weekSuggestion } : {}),
    };
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['appointmentServices', 'appointmentServices.service', 'user'],
      select: {
        id: true,
        userId: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        notes: true,
        totalPrice: true,
        totalDuration: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        appointmentServices: {
          id: true,
          serviceId: true,
          status: true,
          price: true,
          service: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    return appointment;
  }

  async findMyAppointments(
    userId: string,
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string,
  ) {
    const qb = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.appointmentServices', 'as')
      .leftJoinAndSelect('as.service', 'service')
      .select([
        'appointment.id',
        'appointment.userId',
        'appointment.scheduledDate',
        'appointment.scheduledTime',
        'appointment.status',
        'appointment.notes',
        'appointment.totalPrice',
        'appointment.totalDuration',
        'appointment.createdAt',
        'as.id',
        'as.serviceId',
        'as.status',
        'as.price',
        'service.id',
        'service.name',
        'service.durationMinutes',
      ])
      .where('appointment.userId = :userId', { userId });

    if (startDate) {
      qb.andWhere('appointment.scheduledDate >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('appointment.scheduledDate <= :endDate', { endDate });
    }

    qb.orderBy('appointment.scheduledDate', 'DESC')
      .addOrderBy('appointment.scheduledTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.appointmentsRepository.findAndCount({
      relations: ['appointmentServices', 'appointmentServices.service', 'user'],
      select: {
        id: true,
        userId: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        notes: true,
        totalPrice: true,
        totalDuration: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        appointmentServices: {
          id: true,
          serviceId: true,
          status: true,
          price: true,
          service: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
      },
      order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }

  async updateByClient(id: string, userId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findById(id);

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este agendamento');
    }

    this.checkTwoDayRule(appointment.scheduledDate);

    return this.applyUpdate(appointment, dto);
  }

  async cancelByClient(id: string, userId: string) {
    const appointment = await this.findById(id);

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para cancelar este agendamento');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentsRepository.save(appointment);
  }

  async confirmByAdmin(id: string) {
    const appointment = await this.findById(id);
    appointment.status = AppointmentStatus.CONFIRMED;
    return this.appointmentsRepository.save(appointment);
  }

  async adminUpdate(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findById(id);
    return this.applyUpdate(appointment, dto);
  }

  async updateServiceStatus(
    appointmentId: string,
    appointmentServiceId: string,
    status: AppointmentServiceStatus,
  ) {
    const appointmentService = await this.appointmentServicesRepository.findOne({
      where: { id: appointmentServiceId, appointmentId },
      select: ['id', 'status'],
    });

    if (!appointmentService) {
      throw new NotFoundException('Serviço não encontrado neste agendamento');
    }

    appointmentService.status = status;
    return this.appointmentServicesRepository.save(appointmentService);
  }

  async checkSameWeek(userId: string, dateStr: string) {
    const date = dayjs(dateStr);
    const weekStart = date.startOf('isoWeek').format('YYYY-MM-DD');
    const weekEnd = date.endOf('isoWeek').format('YYYY-MM-DD');

    const existing = await this.appointmentsRepository.findOne({
      where: {
        userId,
        scheduledDate: Between(weekStart, weekEnd),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
      select: ['id', 'scheduledDate', 'scheduledTime', 'status'],
    });

    if (!existing) return null;

    return {
      message: 'Você já possui um agendamento nesta semana',
      existingAppointment: existing,
    };
  }

  async checkWeekEndpoint(userId: string, date: string) {
    return this.checkSameWeek(userId, date);
  }

  async checkTimeConflict(
    scheduledDate: string,
    scheduledTime: string,
    totalDuration: number,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.appointmentsRepository.find({
      where: {
        scheduledDate,
        status: Not(AppointmentStatus.CANCELLED),
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
      select: ['id', 'scheduledTime', 'totalDuration'],
    });

    const newStart = this.timeToMinutes(scheduledTime);
    const newEnd = newStart + totalDuration;

    for (const apt of existing) {
      const existingStart = this.timeToMinutes(apt.scheduledTime);
      const existingEnd = existingStart + apt.totalDuration;

      if (newStart < existingEnd && newEnd > existingStart) {
        throw new ConflictException(
          `Horário indisponível. Já existe um agendamento às ${apt.scheduledTime} com duração de ${apt.totalDuration} minutos neste dia.`,
        );
      }
    }
  }

  private checkTwoDayRule(scheduledDate: string) {
    const now = dayjs();
    const scheduled = dayjs(scheduledDate);
    const diff = scheduled.diff(now, 'day');

    if (diff <= 2) {
      throw new BadRequestException(
        'Não é possível editar agendamentos com menos de 2 dias de antecedência. Por favor, entre em contato por telefone.',
      );
    }
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private async applyUpdate(appointment: Appointment, dto: UpdateAppointmentDto) {
    if (dto.scheduledDate) appointment.scheduledDate = dto.scheduledDate;
    if (dto.scheduledTime) appointment.scheduledTime = dto.scheduledTime;
    if (dto.notes !== undefined) appointment.notes = dto.notes || null;
    if (dto.status) appointment.status = dto.status;

    let updatedServices: Service[] | null = null;
    if (dto.serviceIds && dto.serviceIds.length > 0) {
      updatedServices = await this.servicesService.findByIds(dto.serviceIds);
      if (updatedServices.length !== dto.serviceIds.length) {
        throw new BadRequestException('Um ou mais serviços não foram encontrados ou estão inativos');
      }
    }

    // Re-check time conflict whenever date, time, or services changed
    if (dto.scheduledDate || dto.scheduledTime || updatedServices) {
      const duration = updatedServices
        ? updatedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
        : appointment.totalDuration;
      await this.checkTimeConflict(
        appointment.scheduledDate,
        appointment.scheduledTime,
        duration,
        appointment.id,
      );
    }

    if (updatedServices) {
      await this.appointmentServicesRepository.delete({ appointmentId: appointment.id });

      const newAppointmentServices = updatedServices.map((service) =>
        this.appointmentServicesRepository.create({
          appointmentId: appointment.id,
          serviceId: service.id,
          price: service.price,
          status: AppointmentServiceStatus.PENDING,
        }),
      );

      await this.appointmentServicesRepository.save(newAppointmentServices);

      appointment.totalPrice = updatedServices.reduce((sum, s) => sum + Number(s.price), 0);
      appointment.totalDuration = updatedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
    }

    await this.appointmentsRepository.save(appointment);
    return this.findById(appointment.id);
  }

  async getTodayAppointments() {
    const today = dayjs().format('YYYY-MM-DD');

    return this.appointmentsRepository.find({
      where: { scheduledDate: today },
      relations: ['appointmentServices', 'appointmentServices.service', 'user'],
      select: {
        id: true,
        userId: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        notes: true,
        totalPrice: true,
        totalDuration: true,
        createdAt: true,
        user: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        appointmentServices: {
          id: true,
          serviceId: true,
          status: true,
          price: true,
          service: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
      },
      order: { scheduledTime: 'ASC' },
    });
  }

  async getWeeklyStats() {
    const now = dayjs();
    const weekStart = now.startOf('isoWeek').format('YYYY-MM-DD');
    const weekEnd = now.endOf('isoWeek').format('YYYY-MM-DD');

    const appointments = await this.appointmentsRepository.find({
      where: { scheduledDate: Between(weekStart, weekEnd) },
      relations: ['appointmentServices', 'appointmentServices.service'],
      select: {
        id: true,
        status: true,
        totalPrice: true,
        scheduledDate: true,
        appointmentServices: { id: true, service: { id: true, name: true } },
      },
    });

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayCounts: Record<string, number> = Object.fromEntries(dayNames.map((d) => [d, 0]));
    const serviceCounts: Record<string, { name: string; count: number }> = {};
    let confirmedCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0;

    for (const apt of appointments) {
      if (apt.status === AppointmentStatus.CONFIRMED) confirmedCount++;
      if (apt.status === AppointmentStatus.PENDING) pendingCount++;
      if (apt.status !== AppointmentStatus.CANCELLED) totalRevenue += Number(apt.totalPrice);

      dayCounts[dayNames[dayjs(apt.scheduledDate).day()]]++;

      for (const as of apt.appointmentServices ?? []) {
        const name = as.service?.name;
        if (name) {
          if (!serviceCounts[name]) serviceCounts[name] = { name, count: 0 };
          serviceCounts[name].count++;
        }
      }
    }

    const totalAppointments = appointments.length;
    const appointmentsByDay = dayNames.map((day) => ({ day, count: dayCounts[day] }));
    const mostRequestedService = Object.values(serviceCounts).sort((a, b) => b.count - a.count)[0] ?? null;

    return {
      totalAppointments,
      totalRevenue,
      confirmedCount,
      pendingCount,
      mostRequestedService,
      appointmentsByDay,
    };
  }
}
