import { apiGet, apiPost, apiPatch, apiDelete, apiList } from '@/lib/apiClient'

export interface Product {
  _id: string
  clientId?: string
  projectId?: string
  name: string
  description?: string
  features?: string[]
  benefits?: string[]
  requirements?: string
  metadata?: Record<string, unknown>
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductBody {
  clientId?: string
  projectId?: string
  name: string
  description?: string
  features?: string[]
  benefits?: string[]
  requirements?: string
  metadata?: Record<string, unknown>
}

export interface ProductListResponse {
  products: Product[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const productsApi = {
  list: async (params?: Record<string, unknown>): Promise<ProductListResponse> => {
    const { items, meta } = await apiList<Product>('/products', { params })
    return { products: items, meta }
  },
  get: (id: string) => apiGet<Product>(`/products/${id}`),
  create: (body: CreateProductBody) => apiPost<Product>('/products', body),
  update: (id: string, body: Partial<Omit<CreateProductBody, 'clientId'>>) =>
    apiPatch<Product>(`/products/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/products/${id}`),
}
