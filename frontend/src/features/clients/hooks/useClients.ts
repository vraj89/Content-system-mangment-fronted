import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../api/clients.api'
import { queryKeys } from '@/app/queryClient'
import type { CreateClientBody, Client } from '../types/clients.types'

export function useClients(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.clients(params),
    queryFn: () => clientsApi.list(params),
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateClientBody) => clientsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<CreateClientBody>) => clientsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.client(id) })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useSubmitClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => clientsApi.submit(id, note),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.client(v.id) })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useApproveClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsApi.approve(id),
    onSuccess: (data: Client) => {
      qc.invalidateQueries({ queryKey: queryKeys.client(data._id) })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useRejectClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => clientsApi.reject(id, reason),
    onSuccess: (data: Client) => {
      qc.invalidateQueries({ queryKey: queryKeys.client(data._id) })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
