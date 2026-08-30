import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { images } from '@/assets/images'
import { Plus, Search, Users, Check, X, FileText } from 'lucide-react'
import { formatDate } from '@/utils/formatDate'

export function ClientsListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(search)

  useEffect(() => setPage(1), [debounced, status])

  const { data, isLoading, isError, refetch } = useClients({
    search: debounced || undefined,
    status: status || undefined,
    page,
    limit: 10,
  })

  const canApprove = hasPermission(user?.role, user?.permissions, 'CLIENT_APPROVE')
  const canCreate = hasPermission(user?.role, user?.permissions, 'CLIENT_CREATE')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage client onboarding, approvals and accounts."
        image={images.marketingTeam}
        actions={
          canCreate ? (
            <Button onClick={() => navigate('/clients/new')}>
              <Plus className="h-4 w-4" /> New Client
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_ADMIN_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={26} />
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data?.clients.length ? (
          <div className="divide-y divide-border">
            {data.clients.map((c) => (
              <button
                key={c._id}
                onClick={() => navigate(`/clients/${c._id}`)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-secondary/50 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.companyName}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No clients found"
            description="Create your first client to start a campaign."
            action={
              canCreate ? (
                <Button onClick={() => navigate('/clients/new')}>
                  <Plus className="h-4 w-4" /> New Client
                </Button>
              ) : undefined
            }
          />
        )}

        {data?.meta && (
          <div className="border-t border-border p-4">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
