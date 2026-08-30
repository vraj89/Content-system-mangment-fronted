import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UserListItem, type UserDetail } from '../api/users.api'
import { queryKeys } from '@/app/queryClient'

export function useUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => usersApi.list(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => usersApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user(id) })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDisableUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.disable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useSetPermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      usersApi.setPermissions(id, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export type { UserListItem, UserDetail }
