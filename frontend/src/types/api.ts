export interface ApiMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: ApiMeta
}

export interface ApiError {
  success: false
  message: string
  errors?: Array<{ field?: string; message: string }>
}

export interface PaginatedQuery {
  search?: string
  page?: number
  limit?: number
  sort?: string
  [key: string]: unknown
}
