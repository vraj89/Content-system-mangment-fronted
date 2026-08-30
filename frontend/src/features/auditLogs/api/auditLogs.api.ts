import { apiGet, apiList } from '@/lib/apiClient'

export interface AuditLog {
  _id: string
  userId?: string
  role?: string
  action: string
  entityType?: string
  entityId?: string
  projectId?: string
  clientId?: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string
  description?: string
  createdAt: string
}

export interface AuditListResponse {
  auditLogs: AuditLog[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const auditApi = {
  list: async (params?: Record<string, unknown>): Promise<AuditListResponse> => {
    const { items, meta } = await apiList<AuditLog>('/audit-logs', { params })
    return { auditLogs: items, meta }
  },
}
