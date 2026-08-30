import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { revisionsApi, type CreateRevisionBody, type Revision } from '../api/revisions.api'
import { queryKeys } from '@/app/queryClient'

export function useRevisions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.revisions(params),
    queryFn: () => revisionsApi.list(params),
  })
}

export function useRevision(id: string) {
  return useQuery({
    queryKey: queryKeys.revision(id),
    queryFn: () => revisionsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateRevision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRevisionBody) => revisionsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['revisions'] }),
  })
}

export function useUpdateRevision(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Pick<Revision, 'status' | 'priority' | 'assignedTo'>>) =>
      revisionsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.revision(id) })
      qc.invalidateQueries({ queryKey: ['revisions'] })
    },
  })
}

export function useResolveRevision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => revisionsApi.resolve(id),
    onSuccess: (data: Revision) => {
      qc.invalidateQueries({ queryKey: queryKeys.revision(data._id) })
      qc.invalidateQueries({ queryKey: ['revisions'] })
    },
  })
}

export type { Revision }
