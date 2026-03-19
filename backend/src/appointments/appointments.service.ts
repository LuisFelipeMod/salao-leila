import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AppointmentServiceEntity, AppointmentServiceStatus } from './entities/appointment-service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ServicesService } from '../services/services.service';

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

    // Check same-week appointment
    const weekSuggestion = await this.checkSameWeek(userId, dto.scheduledDate);

    const appointment = this.appointmentsRepository.create({
      userId,
      scheduledDate: dto.scheduledDate,
      scheduledTime: dto.scheduledTime,
      notes: dto.notes || null,
      totalPrice,
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

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
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

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
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
      select: ['id', 'appointmentId', 'serviceId', 'status', 'price'],
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
        status: AppointmentStatus.PENDING,
      },
      select: ['id', 'scheduledDate', 'scheduledTime', 'status'],
    });

    if (!existing) {
      // Also check CONFIRMED
      const confirmed = await this.appointmentsRepository.findOne({
        where: {
          userId,
          scheduledDate: Between(weekStart, weekEnd),
          status: AppointmentStatus.CONFIRMED,
        },
        select: ['id', 'scheduledDate', 'scheduledTime', 'status'],
      });
      if (confirmed) {
        return {
          message: 'Você já possui um agendamento nesta semana',
          existingAppointment: confirmed,
        };
      }
      return null;
    }

    return {
      message: 'Você já possui um agendamento nesta semana',
      existingAppointment: existing,
    };
  }

  async checkWeekEndpoint(userId: string, date: string) {
    return this.checkSameWeek(userId, date);
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

  private async applyUpdate(appointment: Appointment, dto: UpdateAppointmentDto) {
    if (dto.scheduledDate) {
      appointment.scheduledDate = dto.scheduledDate;
    }
    if (dto.scheduledTime) {
      appointment.scheduledTime = dto.scheduledTime;
    }
    if (dto.notes !== undefined) {
      appointment.notes = dto.notes || null;
    }
    if (dto.status) {
      appointment.status = dto.status;
    }

    if (dto.serviceIds && dto.serviceIds.length > 0) {
      const services = await this.servicesService.findByIds(dto.serviceIds);
      if (services.length !== dto.serviceIds.length) {
        throw new BadRequestException('Um ou mais serviços não foram encontrados ou estão inativos');
      }

      // Remove old services
      await this.appointmentServicesRepository.delete({ appointmentId: appointment.id });

      // Add new ones
      const newAppointmentServices = services.map((service) =>
        this.appointmentServicesRepository.create({
          appointmentId: appointment.id,
          serviceId: service.id,
          price: service.price,
          status: AppointmentServiceStatus.PENDING,
        }),
      );

      await this.appointmentServicesRepository.save(newAppointmentServices);

      appointment.totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
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

    const totalAppointments = appointments.length;
    const confirmedCount = appointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length;
    const pendingCount = appointments.filter((a) => a.status === AppointmentStatus.PENDING).length;
    const totalRevenue = appointments
      .filter((a) => a.status !== AppointmentStatus.CANCELLED)
      .reduce((sum, a) => sum + Number(a.totalPrice), 0);

    // Appointments by day of week
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      dayCounts[dayNames[i]] = 0;
    }
    for (const apt of appointments) {
      const dow = dayjs(apt.scheduledDate).day();
      dayCounts[dayNames[dow]]++;
    }
    const appointmentsByDay = dayNames.map((day) => ({ day, count: dayCounts[day] }));

    // Most requested service
    const serviceCounts: Record<string, { name: string; count: number }> = {};
    for (const apt of appointments) {
      for (const as of apt.appointmentServices ?? []) {
        const name = as.service?.name;
        if (name) {
          if (!serviceCounts[name]) serviceCounts[name] = { name, count: 0 };
          serviceCounts[name].count++;
        }
      }
    }
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
