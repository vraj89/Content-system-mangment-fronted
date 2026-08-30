import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentsApi, type CreateCommentBody, type Comment } from '../api/comments.api'
import { queryKeys } from '@/app/queryClient'

export function useComments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.comments(params),
    queryFn: () => commentsApi.list(params),
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCommentBody) => commentsApi.create(body),
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: queryKeys.comments({ entityType: v.entityType, entityId: v.entityId }) }),
  })
}

export type { Comment }
