import { apiGet, apiPost, apiPatch, apiList } from '@/lib/apiClient'

export type ContentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'

export interface ContentVersion {
  versionNumber: number
  createdBy?: string
  createdAt: string
  changes?: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'
  snapshot: Record<string, unknown>
}

export interface Content {
  _id: string
  title: string
  shortDescription?: string
  longDescription?: string
  captions?: string[]
  cta?: string
  hashtags?: string[]
  seoFields?: { metaTitle?: string; metaDescription?: string; keywords?: string[]; slug?: string }
  notes?: string
  projectId?: string
  taskId?: string
  clientId?: string
  createdBy?: string
  updatedBy?: string
  currentVersion: number
  status: ContentStatus
  versions?: ContentVersion[]
  createdAt: string
  updatedAt: string
}

export interface CreateContentBody {
  title: string
  shortDescription?: string
  longDescription?: string
  captions?: string[]
  cta?: string
  hashtags?: string[]
  seoFields?: { metaTitle?: string; metaDescription?: string; keywords?: string[]; slug?: string }
  notes?: string
  projectId?: string
  taskId?: string
}

export interface ContentListResponse {
  content: Content[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const contentApi = {
  list: async (params?: Record<string, unknown>): Promise<ContentListResponse> => {
    const { items, meta } = await apiList<Content>('/content', { params })
    return { content: items, meta }
  },
  get: (id: string) => apiGet<Content>(`/content/${id}`),
  versions: (id: string) => apiGet<ContentVersion[]>(`/content/${id}/versions`),
  create: (body: CreateContentBody) => apiPost<Content>('/content', body),
  update: (id: string, body: Partial<Omit<CreateContentBody, 'projectId'>>) =>
    apiPatch<Content>(`/content/${id}`, body),
  submit: (id: string, changes?: string, note?: string) =>
    apiPost<Content>(`/content/${id}/submit`, { changes, note }),
}
