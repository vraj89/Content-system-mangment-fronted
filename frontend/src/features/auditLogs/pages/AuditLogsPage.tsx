import { useState, useEffect } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { images } from '@/assets/images'
import { formatDateTime } from '@/utils/formatDate'

export function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search)
  useEffect(() => setPage(1), [debounced, entity])

  const { data, isLoading, isError, refetch } = useAuditLogs({
    search: debounced || undefined,
    entityType: entity || undefined,
    page,
    limit: 15,
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Immutable trail of all system actions." image={images.adminSquad} />
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions..." className="pl-9" />
          </div>
          <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="sm:w-52">
            <option value="">All entities</option>
            <option value="CLIENT">Client</option>
            <option value="PROJECT">Project</option>
            <option value="TASK">Task</option>
            <option value="CONTENT">Content</option>
            <option value="MEDIA">Media</option>
            <option value="PAYMENT">Payment</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.auditLogs.length ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.entityType ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.role ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.description ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta && <div className="border-t border-border p-4"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </Card>
      ) : (
        <EmptyState icon={<ScrollText className="h-6 w-6" />} title="No audit logs" description="System activity will appear here." />
      )}
    </div>
  )
}
