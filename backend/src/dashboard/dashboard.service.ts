import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class DashboardService {
  constructor(private appointmentsService: AppointmentsService) {}

  async getStats(period: 'weekly' | 'monthly' | 'total' = 'weekly') {
    return this.appointmentsService.getWeeklyStats(period);
  }

  async getTodayAppointments() {
    return this.appointmentsService.getTodayAppointments();
  }
}
