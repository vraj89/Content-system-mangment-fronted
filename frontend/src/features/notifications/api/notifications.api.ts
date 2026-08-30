import { apiGet, apiPost, apiList } from '@/lib/apiClient'
import type { Notification } from '../types/notifications.types'

export interface NotificationsResponse {
  notifications: Notification[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const notificationsApi = {
  list: async (params?: { unread?: boolean; page?: number; limit?: number }) => {
    const { items, meta } = await apiList<Notification>('/notifications', { params })
    return { notifications: items, meta }
  },
  unreadCount: () => apiGet<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => apiPost<unknown>(`/notifications/${id}/read`),
  markAllRead: () => apiPost<unknown>('/notifications/read-all'),
}
