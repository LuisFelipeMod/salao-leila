import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('weekly-stats')
  @ApiOperation({ summary: 'Métricas semanais (admin)' })
  async getWeeklyStats() {
    return this.dashboardService.getWeeklyStats();
  }

  @Get('today')
  @ApiOperation({ summary: 'Agendamentos de hoje (admin)' })
  async getTodayAppointments() {
    return this.dashboardService.getTodayAppointments();
  }
}
