import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentApi, type CreateContentBody, type Content, type ContentVersion } from '../api/content.api'
import { queryKeys } from '@/app/queryClient'

export function useContent(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.content(params),
    queryFn: () => contentApi.list(params),
  })
}

export function useContentItem(id: string) {
  return useQuery({
    queryKey: queryKeys.contentItem(id),
    queryFn: () => contentApi.get(id),
    enabled: !!id,
  })
}

export function useContentVersions(id: string) {
  return useQuery({
    queryKey: queryKeys.contentVersions(id),
    queryFn: () => contentApi.versions(id),
    enabled: !!id,
  })
}

export function useCreateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContentBody) => contentApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content'] }),
  })
}

export function useUpdateContent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Omit<CreateContentBody, 'projectId'>>) => contentApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contentItem(id) })
      qc.invalidateQueries({ queryKey: ['content'] })
    },
  })
}

export function useSubmitContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes, note }: { id: string; changes?: string; note?: string }) =>
      contentApi.submit(id, changes, note),
    onSuccess: (data: Content) => {
      qc.invalidateQueries({ queryKey: queryKeys.contentItem(data._id) })
      qc.invalidateQueries({ queryKey: ['content'] })
    },
  })
}

export type { Content, ContentVersion }
