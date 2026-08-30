import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type CreateProjectBody, type Project, type ProjectStatus } from '../api/projects.api'
import { queryKeys } from '@/app/queryClient'

export function useProjects(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => projectsApi.list(params),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateProjectBody) => projectsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<CreateProjectBody & { status: ProjectStatus }>) =>
      projectsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.project(id) })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function usePublishProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => projectsApi.publish(id, note),
    onSuccess: (data: Project) => {
      qc.invalidateQueries({ queryKey: queryKeys.project(data._id) })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useClientApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.clientApprove(id),
    onSuccess: (data: Project) => qc.invalidateQueries({ queryKey: queryKeys.project(data._id) }),
  })
}

export function useClientRevision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => projectsApi.clientRevision(id, note),
    onSuccess: (data: Project) => qc.invalidateQueries({ queryKey: queryKeys.project(data._id) }),
  })
}
