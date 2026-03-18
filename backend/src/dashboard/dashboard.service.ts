import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service.js';

@Injectable()
export class DashboardService {
  constructor(private appointmentsService: AppointmentsService) {}

  async getWeeklyStats() {
    return this.appointmentsService.getWeeklyStats();
  }

  async getTodayAppointments() {
    return this.appointmentsService.getTodayAppointments();
  }
}
