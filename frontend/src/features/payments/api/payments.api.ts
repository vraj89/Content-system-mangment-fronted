import { apiGet, apiPost, apiPatch, apiDelete, apiList } from '@/lib/apiClient'

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'

export interface Payment {
  _id: string
  clientId?: string
  projectId?: string
  invoiceNumber: string
  amount: number
  currency?: string
  dueDate?: string
  paidAmount?: number
  remainingAmount?: number
  paymentStatus: PaymentStatus
  paymentMethod?: string
  transactionReference?: string
  notes?: string
  visibleToClient: boolean
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentBody {
  clientId?: string
  projectId?: string
  invoiceNumber: string
  amount: number
  currency?: string
  dueDate?: string
  paymentMethod?: string
  notes?: string
  visibleToClient?: boolean
}

export interface PaymentListResponse {
  payments: Payment[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export const paymentsApi = {
  list: async (params?: Record<string, unknown>): Promise<PaymentListResponse> => {
    const { items, meta } = await apiList<Payment>('/payments', { params })
    return { payments: items, meta }
  },
  get: (id: string) => apiGet<Payment>(`/payments/${id}`),
  create: (body: CreatePaymentBody) => apiPost<Payment>('/payments', body),
  update: (id: string, body: Partial<{ paidAmount: number; paymentStatus: PaymentStatus; paymentMethod: string; transactionReference: string; dueDate: string; notes: string; visibleToClient: boolean }>) =>
    apiPatch<Payment>(`/payments/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/payments/${id}`),
}
