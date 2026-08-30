import { apiGet, apiPost, apiPatch, apiDelete, apiList } from '@/lib/apiClient'

export interface Comment {
  _id: string
  author: string
  authorName: string
  role?: string
  entityType: string
  entityId: string
  projectId?: string
  message: string
  attachments?: { name: string; url: string }[]
  mentions?: string[]
  createdAt: string
}

export interface CreateCommentBody {
  entityType: string
  entityId: string
  projectId?: string
  message: string
  attachments?: { name: string; url: string }[]
  mentions?: string[]
}

export interface CommentListResponse {
  comments: Comment[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const commentsApi = {
  list: async (params?: Record<string, unknown>): Promise<CommentListResponse> => {
    const { items, meta } = await apiList<Comment>('/comments', { params })
    return { comments: items, meta }
  },
  create: (body: CreateCommentBody) => apiPost<Comment>('/comments', body),
  update: (id: string, message: string) => apiPatch<Comment>(`/comments/${id}`, { message }),
  remove: (id: string) => apiDelete<unknown>(`/comments/${id}`),
}
