import api from './index'
import type { SalonService } from '../../types'

export const servicesApi = {
  async getServices(): Promise<SalonService[]> {
    const { data } = await api.get('/services')
    return data
  },

  async createService(payload: {
    name: string
    description: string
    price: number
    durationMinutes: number
  }): Promise<SalonService> {
    const { data } = await api.post('/services', payload)
    return data
  },

  async updateService(
    id: string,
    payload: Partial<{
      name: string
      description: string
      price: number
      durationMinutes: number
      isActive: boolean
    }>
  ): Promise<SalonService> {
    const { data } = await api.put(`/services/${id}`, payload)
    return data
  },

  async deleteService(id: string): Promise<void> {
    await api.delete(`/services/${id}`)
  },
}
