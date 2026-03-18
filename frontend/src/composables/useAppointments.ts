import dayjs from 'dayjs'
import { AppointmentStatus } from '../types'

export function useAppointments() {
  function formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatDate(date: string): string {
    return dayjs(date).format('DD/MM/YYYY')
  }

  function formatTime(time: string): string {
    return time.slice(0, 5)
  }

  function formatDateTime(date: string, time: string): string {
    return `${formatDate(date)} às ${formatTime(time)}`
  }

  function canEdit(scheduledDate: string): boolean {
    const appointmentDate = dayjs(scheduledDate)
    const now = dayjs()
    return appointmentDate.diff(now, 'day') > 2
  }

  function getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'Pendente',
      [AppointmentStatus.CONFIRMED]: 'Confirmado',
      [AppointmentStatus.IN_PROGRESS]: 'Em Andamento',
      [AppointmentStatus.COMPLETED]: 'Concluído',
      [AppointmentStatus.CANCELLED]: 'Cancelado',
    }
    return labels[status] || status
  }

  function getServiceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluído',
    }
    return labels[status] || status
  }

  function isUpcoming(scheduledDate: string, scheduledTime: string): boolean {
    const dateTime = dayjs(`${scheduledDate}T${scheduledTime}`)
    return dateTime.isAfter(dayjs())
  }

  return {
    formatPrice,
    formatDate,
    formatTime,
    formatDateTime,
    canEdit,
    getStatusLabel,
    getServiceStatusLabel,
    isUpcoming,
  }
}
