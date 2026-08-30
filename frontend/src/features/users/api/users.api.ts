import { apiGet, apiPost, apiPatch, apiList } from '@/lib/apiClient'

export interface UserListItem {
  _id: string
  name: string
  email: string
  role: string
  status: string
  isActive: boolean
  createdAt: string
}

export interface UserDetail extends UserListItem {
  phone?: string
  permissions: string[]
  lastLoginAt?: string
}

export interface UserListResponse {
  users: UserListItem[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const usersApi = {
  list: async (params?: Record<string, unknown>): Promise<UserListResponse> => {
    const { items, meta } = await apiList<UserListItem>('/users', { params })
    return { users: items, meta }
  },
  get: (id: string) => apiGet<UserDetail>(`/users/${id}`),
  update: (id: string, body: Record<string, unknown>) => apiPatch<UserDetail>(`/users/${id}`, body),
  disable: (id: string) => apiPost<unknown>(`/users/${id}/disable`),
  setPermissions: (id: string, permissions: string[]) =>
    apiPost<unknown>(`/users/${id}/permissions`, { permissions }),
}
