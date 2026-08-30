import { apiGet } from '@/lib/apiClient'
import type { DashboardData, ActivityItem } from '../types/dashboard.types'

export const dashboardApi = {
  get: () => apiGet<DashboardData>('/dashboard'),
  activity: (projectId?: string) =>
    apiGet<{ activity: ActivityItem[] }>(
      '/dashboard/activity',
      projectId ? { params: { projectId } } : undefined,
    ),
}
