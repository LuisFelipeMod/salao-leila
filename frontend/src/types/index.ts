export const UserRole = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const AppointmentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

export const ServiceStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus]

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface SalonService {
  id: string
  name: string
  description: string
  price: number
  durationMinutes: number
  isActive: boolean
}

export interface AppointmentServiceItem {
  id: string
  serviceId: string
  service: SalonService
  status: ServiceStatus
  price: number
}

export interface Appointment {
  id: string
  userId: string
  user?: User
  scheduledDate: string
  scheduledTime: string
  status: AppointmentStatus
  notes?: string
  totalPrice: number
  appointmentServices: AppointmentServiceItem[]
  createdAt: string
  updatedAt: string
}

export interface WeeklyStats {
  totalAppointments: number
  totalRevenue: number
  confirmedCount: number
  pendingCount: number
  mostRequestedService: { name: string; count: number }
  appointmentsByDay: { day: string; count: number }[]
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
}

export interface CreateAppointmentPayload {
  scheduledDate: string
  scheduledTime: string
  notes?: string
  serviceIds: string[]
}

export interface UpdateAppointmentPayload {
  scheduledDate?: string
  scheduledTime?: string
  notes?: string
  serviceIds?: string[]
}
