import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AppointmentServiceStatus } from './entities/appointment-service.entity';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar agendamento (cliente)' })
  async create(
    @Request() req: { user: AuthUser },
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(req.user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Meus agendamentos (cliente)' })
  async findMy(
    @Request() req: { user: AuthUser },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findMyAppointments(
      req.user.id,
      +page,
      +limit,
      startDate,
      endDate,
    );
  }

  @Get('check-week')
  @ApiOperation({ summary: 'Verificar agendamento na mesma semana' })
  async checkWeek(
    @Request() req: { user: AuthUser },
    @Query('date') date: string,
  ) {
    const result = await this.appointmentsService.checkWeekEndpoint(req.user.id, date);
    return result || { message: 'Nenhum agendamento encontrado nesta semana' };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos os agendamentos (admin)' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.appointmentsService.findAll(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar agendamento (cliente, regra 2 dias)' })
  async update(
    @Request() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateByClient(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar agendamento (cliente)' })
  async cancel(
    @Request() req: { user: AuthUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentsService.cancelByClient(id, req.user.id);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirmar agendamento (admin)' })
  async confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.confirmByAdmin(id);
  }

  @Patch(':id/admin-update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Editar agendamento sem restrição (admin)' })
  async adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.adminUpdate(id, dto);
  }

  @Patch(':id/services/:serviceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar status de serviço no agendamento (admin)' })
  async updateServiceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body('status') status: AppointmentServiceStatus,
  ) {
    return this.appointmentsService.updateServiceStatus(id, serviceId, status);
  }
}
