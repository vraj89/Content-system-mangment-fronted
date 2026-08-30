import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { storage } from './storage'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export interface StandardResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class ApiClientError extends Error {
  status: number
  errors?: Array<{ field?: string; message: string }>
  constructor(message: string, status: number, errors?: Array<{ field?: string; message: string }>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getToken()
  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = storage.getRefresh()
  if (!refreshToken) return null
  try {
    const res = await axios.post<StandardResponse<{ accessToken: string; refreshToken: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { baseURL: '' },
    )
    const { accessToken, refreshToken: newRefresh } = res.data.data
    storage.setToken(accessToken)
    storage.setRefresh(newRefresh)
    return accessToken
  } catch {
    return null
  }
}

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string; errors?: Array<{ field?: string; message: string }> }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(client(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const newToken = await refreshAccessToken()
      isRefreshing = false

      if (newToken) {
        onTokenRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      }

      onTokenRefreshed(null)
      storage.clearAll()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
      return Promise.reject(
        new ApiClientError('Your session has expired. Please sign in again.', 401),
      )
    }

    const data = error.response?.data
    const message =
      data?.message ?? error.message ?? 'Something went wrong. Please try again.'
    const errors = data?.errors
    return Promise.reject(
      new ApiClientError(
        message,
        error.response?.status ?? 500,
        errors,
      ),
    )
  },
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.get<StandardResponse<T>>(url, config)
  return res.data.data
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.post<StandardResponse<T>>(url, body, config)
  return res.data.data
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.patch<StandardResponse<T>>(url, body, config)
  return res.data.data
}

export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const res = await client.delete<StandardResponse<T>>(url, { data: body })
  return res.data.data
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const res = await client.post<StandardResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export function getMeta<T>(res: AxiosResponse<StandardResponse<T>>) {
  return res.data.meta
}

export interface ListResponse<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Fetches a paginated list. The backend may return the array directly in
 * `data` OR nest it inside an object (e.g. `{ clients: [...], meta }`).
 * This normalises both shapes into `{ items, meta }`.
 */
export async function apiList<T>(
  url: string,
  params?: AxiosRequestConfig,
): Promise<ListResponse<T>> {
  const res = await client.get<StandardResponse<unknown>>(url, params)
  const payload = res.data.data
  const topMeta = res.data.meta
  let items: T[] = []
  let meta = topMeta ?? { page: 1, limit: 0, total: 0, totalPages: 0 }

  if (Array.isArray(payload)) {
    items = payload as T[]
  } else if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    const found = Object.values(obj).find((v) => Array.isArray(v)) as T[] | undefined
    items = found ?? []
    if (obj.meta && typeof obj.meta === 'object') {
      meta = obj.meta as typeof meta
    }
  }
  return { items, meta }
}

export { client as apiClient }
