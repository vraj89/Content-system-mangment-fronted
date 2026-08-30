import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type CreateTaskBody, type Task, type TaskStatus, type TaskPriority } from '../api/tasks.api'
import { queryKeys } from '@/app/queryClient'

export function useTasks(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => tasksApi.list(params),
  })
}

export function useTaskWorkload() {
  return useQuery({
    queryKey: ['taskWorkload'],
    queryFn: () => tasksApi.workload(),
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTaskBody) => tasksApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Omit<CreateTaskBody, 'projectId'>>) => tasksApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.task(id) })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useAssignTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assignedTo, assignedTeam }: { id: string; assignedTo: string; assignedTeam?: string }) =>
      tasksApi.assign(id, assignedTo, assignedTeam),
    onSuccess: (data: Task) => {
      qc.invalidateQueries({ queryKey: queryKeys.task(data._id) })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, actualHours }: { id: string; status: TaskStatus; actualHours?: number }) =>
      tasksApi.status(id, status, actualHours),
    onSuccess: (data: Task) => {
      qc.invalidateQueries({ queryKey: queryKeys.task(data._id) })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export type { Task, TaskStatus, TaskPriority }
