import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsApi, type CreatePaymentBody, type Payment, type PaymentStatus } from '../api/payments.api'
import { queryKeys } from '@/app/queryClient'

export function usePayments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.payments(params),
    queryFn: () => paymentsApi.list(params),
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payment(id),
    queryFn: () => paymentsApi.get(id),
    enabled: !!id,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePaymentBody) => paymentsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useUpdatePayment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<{ paidAmount: number; paymentStatus: PaymentStatus; paymentMethod: string; transactionReference: string; dueDate: string; notes: string; visibleToClient: boolean }>) =>
      paymentsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payment(id) })
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export type { Payment }
