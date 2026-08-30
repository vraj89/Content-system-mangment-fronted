import { apiGet, apiPost, apiList } from '@/lib/apiClient'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'

export interface Approval {
  _id: string
  entityType: string
  entityId: string
  projectId?: string
  requestedBy?: string
  reviewedBy?: string
  reviewerRole?: string
  status: ApprovalStatus
  comment?: string
  version?: number
  reviewedAt?: string
  createdAt: string
}

export interface CreateApprovalBody {
  entityType: string
  entityId: string
  projectId?: string
  version?: number
}

export interface ApprovalListResponse {
  approvals: Approval[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const approvalsApi = {
  list: async (params?: Record<string, unknown>): Promise<ApprovalListResponse> => {
    const { items, meta } = await apiList<Approval>('/approvals', { params })
    return { approvals: items, meta }
  },
  get: (id: string) => apiGet<Approval>(`/approvals/${id}`),
  create: (body: CreateApprovalBody) => apiPost<Approval>('/approvals', body),
  approve: (id: string, comment?: string) => apiPost<Approval>(`/approvals/${id}/approve`, { comment }),
  reject: (id: string, comment?: string) => apiPost<Approval>(`/approvals/${id}/reject`, { comment }),
  requestRevision: (id: string, comment?: string) =>
    apiPost<Approval>(`/approvals/${id}/request-revision`, { comment }),
}
