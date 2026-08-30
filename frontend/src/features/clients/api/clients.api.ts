import { apiGet, apiPost, apiPatch, apiDelete, apiList } from '@/lib/apiClient'
import type { Client, CreateClientBody, ClientListResponse } from '../types/clients.types'

export const clientsApi = {
  list: async (params?: Record<string, unknown>): Promise<ClientListResponse> => {
    const { items, meta } = await apiList<Client>('/clients', { params })
    return { clients: items, meta }
  },
  get: (id: string) => apiGet<Client>(`/clients/${id}`),
  create: (body: CreateClientBody) => apiPost<Client>('/clients', body),
  update: (id: string, body: Partial<CreateClientBody>) =>
    apiPatch<Client>(`/clients/${id}`, body),
  submit: (id: string, note?: string) => apiPost<Client>(`/clients/${id}/submit`, { note }),
  approve: (id: string) => apiPost<Client>(`/clients/${id}/approve`),
  reject: (id: string, reason?: string) => apiPost<Client>(`/clients/${id}/reject`, { reason }),
  remove: (id: string) => apiDelete<unknown>(`/clients/${id}`),
}
