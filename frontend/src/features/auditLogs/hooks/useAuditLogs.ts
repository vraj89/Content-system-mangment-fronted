import { useQuery } from '@tanstack/react-query'
import { auditApi, type AuditLog } from '../api/auditLogs.api'
import { queryKeys } from '@/app/queryClient'

export function useAuditLogs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => auditApi.list(params),
  })
}

export type { AuditLog }
