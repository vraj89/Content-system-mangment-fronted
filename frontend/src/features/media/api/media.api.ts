import { apiGet, apiUpload, apiPost, apiList } from '@/lib/apiClient'

export type MediaStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY_FOR_REVIEW'
  | 'REVISION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'FAILED'

export interface MediaVersion {
  version: number
  fileName: string
  storageUrl: string
  publicId?: string
  mimeType?: string
  fileSize?: number
  resolution?: string
  duration?: number
  uploadedBy?: string
  createdAt: string
  approvalStatus?: string
}

export interface Media {
  _id: string
  fileName: string
  originalFile?: string
  optimizedFile?: string
  thumbnail?: string
  fileType: 'image' | 'video' | 'document'
  mimeType?: string
  fileSize?: number
  duration?: number
  resolution?: string
  storageUrl?: string
  publicId?: string
  uploadedBy?: string
  projectId?: string
  taskId?: string
  clientId?: string
  version: number
  status: MediaStatus
  versions?: MediaVersion[]
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MediaListResponse {
  media: Media[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const mediaApi = {
  list: async (params?: Record<string, unknown>): Promise<MediaListResponse> => {
    const { items, meta } = await apiList<Media>('/media', { params })
    return { media: items, meta }
  },
  get: (id: string) => apiGet<Media>(`/media/${id}`),
  upload: (formData: FormData) => apiUpload<Media>('/media', formData),
  replace: (id: string, formData: FormData) => apiUpload<Media>(`/media/${id}/replace`, formData),
}
