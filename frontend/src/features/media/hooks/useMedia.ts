import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mediaApi, type Media } from '../api/media.api'
import { queryKeys } from '@/app/queryClient'

export function useMedia(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.media(params),
    queryFn: () => mediaApi.list(params),
  })
}

export function useMediaItem(id: string) {
  return useQuery({
    queryKey: queryKeys.mediaItem(id),
    queryFn: () => mediaApi.get(id),
    enabled: !!id,
  })
}

export function useUploadMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => mediaApi.upload(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })
}

export function useReplaceMedia(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => mediaApi.replace(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mediaItem(id) })
      qc.invalidateQueries({ queryKey: ['media'] })
    },
  })
}

export type { Media }
