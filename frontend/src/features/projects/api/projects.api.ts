import { apiGet, apiPost, apiPatch, apiDelete, apiList } from '@/lib/apiClient'

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'CANCELLED'

export interface Project {
  _id: string
  clientId?: string
  createdBy?: string
  name: string
  description?: string
  requirements?: string
  status: ProjectStatus
  clientApproved: boolean
  adminApproved: boolean
  paymentRequired: boolean
  paymentSatisfied: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectBody {
  clientId?: string
  name: string
  description?: string
  requirements?: string
  paymentRequired?: boolean
}

export interface ProjectListResponse {
  projects: Project[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const projectsApi = {
  list: async (params?: Record<string, unknown>): Promise<ProjectListResponse> => {
    const { items, meta } = await apiList<Project>('/projects', { params })
    return { projects: items, meta }
  },
  get: (id: string) => apiGet<Project>(`/projects/${id}`),
  create: (body: CreateProjectBody) => apiPost<Project>('/projects', body),
  update: (id: string, body: Partial<CreateProjectBody & { status: ProjectStatus }>) =>
    apiPatch<Project>(`/projects/${id}`, body),
  publish: (id: string, note?: string) => apiPost<Project>(`/projects/${id}/publish`, { note }),
  remove: (id: string) => apiDelete<unknown>(`/projects/${id}`),
  clientApprove: (id: string) => apiPost<Project>(`/projects/${id}/client-approve`),
  clientRevision: (id: string, note?: string) =>
    apiPost<Project>(`/projects/${id}/client-revision`, { note }),
}
