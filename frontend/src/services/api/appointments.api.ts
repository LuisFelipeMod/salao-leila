import api from './index'
import type {
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  ServiceStatus,
  AppointmentStatus,
  WeeklyStats,
} from '../../types'

export const appointmentsApi = {
  async create(payload: CreateAppointmentPayload): Promise<Appointment> {
    const { data } = await api.post('/appointments', payload)
    return data
  },

  async getMyAppointments(params?: {
    startDate?: string
    endDate?: string
  }): Promise<Appointment[]> {
    const { data } = await api.get('/appointments/my', { params })
    return data
  },

  async getById(id: string): Promise<Appointment> {
    const { data } = await api.get(`/appointments/${id}`)
    return data
  },

  async checkWeek(date: string): Promise<{ hasAppointment: boolean; appointment?: Appointment }> {
    const { data } = await api.get('/appointments/check-week', { params: { date } })
    return data
  },

  async update(id: string, payload: UpdateAppointmentPayload): Promise<Appointment> {
    const { data } = await api.put(`/appointments/${id}`, payload)
    return data
  },

  async cancel(id: string): Promise<Appointment> {
    const { data } = await api.patch(`/appointments/${id}/cancel`)
    return data
  },

  // Admin endpoints
  async getAll(params?: {
    status?: AppointmentStatus
    startDate?: string
    endDate?: string
    clientName?: string
    page?: number
    limit?: number
  }): Promise<{ data: Appointment[]; total: number; page: number; totalPages: number }> {
    const { data } = await api.get('/appointments', { params })
    return data
  },

  async confirm(id: string): Promise<Appointment> {
    const { data } = await api.patch(`/appointments/${id}/confirm`)
    return data
  },

  async adminUpdate(
    id: string,
    payload: { status?: AppointmentStatus; notes?: string }
  ): Promise<Appointment> {
    const { data } = await api.patch(`/appointments/${id}/admin`, payload)
    return data
  },

  async updateServiceStatus(
    appointmentId: string,
    serviceItemId: string,
    status: ServiceStatus
  ): Promise<Appointment> {
    const { data } = await api.patch(
      `/appointments/${appointmentId}/services/${serviceItemId}`,
      { status }
    )
    return data
  },

  async getWeeklyStats(): Promise<WeeklyStats> {
    const { data } = await api.get('/appointments/stats/weekly')
    return data
  },
}
