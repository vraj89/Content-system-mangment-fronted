import { apiGet, apiPost, apiPatch, apiList } from '@/lib/apiClient'

export type RevisionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface Revision {
  _id: string
  projectId?: string
  entityType: string
  entityId: string
  version?: number
  requestedBy?: string
  reason: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: RevisionStatus
  assignedTo?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRevisionBody {
  projectId?: string
  entityType: string
  entityId: string
  version?: number
  reason: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?: string
}

export interface RevisionListResponse {
  revisions: Revision[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const revisionsApi = {
  list: async (params?: Record<string, unknown>): Promise<RevisionListResponse> => {
    const { items, meta } = await apiList<Revision>('/revisions', { params })
    return { revisions: items, meta }
  },
  get: (id: string) => apiGet<Revision>(`/revisions/${id}`),
  create: (body: CreateRevisionBody) => apiPost<Revision>('/revisions', body),
  update: (id: string, body: Partial<Pick<Revision, 'status' | 'priority' | 'assignedTo'>>) =>
    apiPatch<Revision>(`/revisions/${id}`, body),
  resolve: (id: string) => apiPost<Revision>(`/revisions/${id}/resolve`),
}
