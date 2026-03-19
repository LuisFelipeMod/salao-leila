import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Appointment, CreateAppointmentPayload, UpdateAppointmentPayload, AppointmentStatus, ServiceStatus } from '../types'
import { appointmentsApi } from '../services/api/appointments.api'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref<Appointment[]>([])
  const currentAppointment = ref<Appointment | null>(null)
  const loading = ref(false)
  const totalPages = ref(1)
  const currentPage = ref(1)
  const total = ref(0)

  async function fetchMyAppointments(params?: { startDate?: string; endDate?: string }) {
    loading.value = true
    try {
      appointments.value = await appointmentsApi.getMyAppointments(params)
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    try {
      currentAppointment.value = await appointmentsApi.getById(id)
    } finally {
      loading.value = false
    }
  }

  async function createAppointment(payload: CreateAppointmentPayload) {
    loading.value = true
    try {
      const result = await appointmentsApi.create(payload)
      appointments.value.unshift(result.appointment)
      return result
    } finally {
      loading.value = false
    }
  }

  async function updateAppointment(id: string, payload: UpdateAppointmentPayload) {
    loading.value = true
    try {
      const updated = await appointmentsApi.update(id, payload)
      const idx = appointments.value.findIndex((a) => a.id === id)
      if (idx !== -1) appointments.value[idx] = updated
      if (currentAppointment.value?.id === id) currentAppointment.value = updated
      return updated
    } finally {
      loading.value = false
    }
  }

  async function cancelAppointment(id: string) {
    loading.value = true
    try {
      const updated = await appointmentsApi.cancel(id)
      const idx = appointments.value.findIndex((a) => a.id === id)
      if (idx !== -1) appointments.value[idx] = updated
      if (currentAppointment.value?.id === id) currentAppointment.value = updated
      return updated
    } finally {
      loading.value = false
    }
  }

  async function checkWeek(date: string) {
    return await appointmentsApi.checkWeek(date)
  }

  // Admin
  async function fetchAll(params?: {
    status?: AppointmentStatus
    startDate?: string
    endDate?: string
    clientName?: string
    page?: number
    limit?: number
  }) {
    loading.value = true
    try {
      const result = await appointmentsApi.getAll(params)
      appointments.value = result.data
      totalPages.value = result.totalPages
      currentPage.value = result.page
      total.value = result.total
    } finally {
      loading.value = false
    }
  }

  async function confirmAppointment(id: string) {
    const updated = await appointmentsApi.confirm(id)
    const idx = appointments.value.findIndex((a) => a.id === id)
    if (idx !== -1) appointments.value[idx] = updated
    return updated
  }

  async function adminUpdate(id: string, payload: { status?: AppointmentStatus; notes?: string }) {
    const updated = await appointmentsApi.adminUpdate(id, payload)
    const idx = appointments.value.findIndex((a) => a.id === id)
    if (idx !== -1) appointments.value[idx] = updated
    return updated
  }

  async function updateServiceStatus(appointmentId: string, serviceItemId: string, status: ServiceStatus) {
    const updated = await appointmentsApi.updateServiceStatus(appointmentId, serviceItemId, status)
    const idx = appointments.value.findIndex((a) => a.id === appointmentId)
    if (idx !== -1) appointments.value[idx] = updated
    return updated
  }

  async function fetchWeeklyStats() {
    return await appointmentsApi.getWeeklyStats()
  }

  return {
    appointments,
    currentAppointment,
    loading,
    totalPages,
    currentPage,
    total,
    fetchMyAppointments,
    fetchById,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    checkWeek,
    fetchAll,
    confirmAppointment,
    adminUpdate,
    updateServiceStatus,
    fetchWeeklyStats,
  }
})
