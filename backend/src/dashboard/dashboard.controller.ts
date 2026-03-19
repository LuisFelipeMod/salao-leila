import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Métricas do dashboard (admin) — period: weekly | monthly | total' })
  async getStats(@Query('period') period: 'weekly' | 'monthly' | 'total' = 'weekly') {
    return this.dashboardService.getStats(period);
  }

  @Get('today')
  @ApiOperation({ summary: 'Agendamentos de hoje (admin)' })
  async getTodayAppointments() {
    return this.dashboardService.getTodayAppointments();
  }
}
