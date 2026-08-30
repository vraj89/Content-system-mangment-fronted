import { apiGet, apiPost, apiPatch, apiDelete, apiList } from '@/lib/apiClient'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  _id: string
  title: string
  description?: string
  projectId?: string
  clientId?: string
  assignedTo?: { _id: string; name: string; email: string; role?: string } | string
  assignedTeam?: string
  taskType?: string
  priority: TaskPriority
  status: TaskStatus
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  dependencies?: string[]
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskBody {
  title: string
  description?: string
  projectId?: string
  assignedTo?: string
  assignedTeam?: string
  taskType?: string
  priority?: TaskPriority
  status?: TaskStatus
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  dependencies?: string[]
}

export interface TaskListResponse {
  tasks: Task[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface WorkloadMember {
  member: { _id: string; name: string; email: string; role: string }
  assigned: number
  active: number
  completed: number
  overdue: number
  currentLoad: number
}

export interface TaskWorkloadResponse {
  workload: WorkloadMember[]
  unassignedTasks: number
  overdueTasks: Task[]
}

export const tasksApi = {
  list: async (params?: Record<string, unknown>): Promise<TaskListResponse> => {
    const { items, meta } = await apiList<Task>('/tasks', { params })
    return { tasks: items, meta }
  },
  get: (id: string) => apiGet<Task>(`/tasks/${id}`),
  create: (body: CreateTaskBody) => apiPost<Task>('/tasks', body),
  update: (id: string, body: Partial<Omit<CreateTaskBody, 'projectId'>>) =>
    apiPatch<Task>(`/tasks/${id}`, body),
  assign: (id: string, assignedTo: string, assignedTeam?: string) =>
    apiPost<Task>(`/tasks/${id}/assign`, { assignedTo, assignedTeam }),
  status: (id: string, status: TaskStatus, actualHours?: number) =>
    apiPost<Task>(`/tasks/${id}/status`, { status, actualHours }),
  workload: () => apiGet<TaskWorkloadResponse>('/tasks/workload'),
  remove: (id: string) => apiDelete<unknown>(`/tasks/${id}`),
}
