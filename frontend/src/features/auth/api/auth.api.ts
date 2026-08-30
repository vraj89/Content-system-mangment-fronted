import { apiPost, apiGet } from '@/lib/apiClient'
import type { User } from '@/types/permissions'

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      email,
      password,
    }),
  forgotPassword: (email: string) => apiPost<unknown>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiPost<unknown>('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost<unknown>('/auth/change-password', { currentPassword, newPassword }),
  me: () => apiGet<User>('/auth/me'),
}
