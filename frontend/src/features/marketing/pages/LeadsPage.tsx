import { useNavigate } from 'react-router-dom'
import { Target, ChevronRight } from 'lucide-react'
import { useClients } from '@/features/clients/hooks/useClients'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

export function LeadsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useClients({ limit: 100 })
  const clients = data?.clients ?? []

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError) return <EmptyState title="Could not load leads" action={<button onClick={() => refetch()}>Retry</button>} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Prospective clients gathered by Marketing."
        image={images.marketingTeam}
        actions={<button onClick={() => navigate('/clients/new')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white">+ Add Client</button>}
      />
      <Card>
        {clients.length === 0 ? (
          <EmptyState icon={<Target className="h-6 w-6" />} title="No leads yet" description="Add a client to start the pipeline." />
        ) : (
          <div className="divide-y divide-border">
            {clients.map((c) => (
              <button key={c._id} onClick={() => navigate(`/clients/${c._id}`)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-secondary/50">
                <div>
                  <p className="font-medium">{c.companyName}</p>
                  <p className="text-xs text-muted-foreground">{c.email} · added {formatDate(c.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
