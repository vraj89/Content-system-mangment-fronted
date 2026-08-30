import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import { queryKeys } from '@/app/queryClient'

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: dashboardApi.get,
  })
}

export function useDashboardActivity(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboardActivity(projectId),
    queryFn: () => dashboardApi.activity(projectId),
  })
}
