import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approvalsApi, type Approval, type CreateApprovalBody } from '../api/approvals.api'
import { queryKeys } from '@/app/queryClient'

export function useApprovals(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.approvals(params),
    queryFn: () => approvalsApi.list(params),
  })
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approval(id),
    queryFn: () => approvalsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateApprovalBody) => approvalsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
}

export function useApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approvalsApi.approve(id, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
}

export function useRejectApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approvalsApi.reject(id, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
}

export function useRequestRevision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalsApi.requestRevision(id, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
}

export type { Approval }
