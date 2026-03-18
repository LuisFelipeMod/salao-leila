import api from './index'
import type { LoginPayload, RegisterPayload, User } from '../../types'

export const authApi = {
  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/login', payload)
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me')
    return data
  },
}
