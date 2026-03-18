import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SalonService } from '../types'
import { servicesApi } from '../services/api/services.api'

export const useServicesStore = defineStore('services', () => {
  const services = ref<SalonService[]>([])
  const loading = ref(false)

  async function fetchServices() {
    loading.value = true
    try {
      services.value = await servicesApi.getServices()
    } finally {
      loading.value = false
    }
  }

  async function createService(payload: {
    name: string
    description: string
    price: number
    durationMinutes: number
  }) {
    loading.value = true
    try {
      const service = await servicesApi.createService(payload)
      services.value.push(service)
      return service
    } finally {
      loading.value = false
    }
  }

  async function updateService(
    id: string,
    payload: Partial<{
      name: string
      description: string
      price: number
      durationMinutes: number
      isActive: boolean
    }>
  ) {
    loading.value = true
    try {
      const updated = await servicesApi.updateService(id, payload)
      const idx = services.value.findIndex((s) => s.id === id)
      if (idx !== -1) services.value[idx] = updated
      return updated
    } finally {
      loading.value = false
    }
  }

  async function deleteService(id: string) {
    loading.value = true
    try {
      await servicesApi.deleteService(id)
      services.value = services.value.filter((s) => s.id !== id)
    } finally {
      loading.value = false
    }
  }

  return {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
    deleteService,
  }
})
