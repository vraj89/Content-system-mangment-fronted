import { useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { images } from '@/assets/images'

const STAGES = [
  { key: 'LEAD', label: 'Lead', to: '/leads' },
  { key: 'ONBOARDING', label: 'Onboarding', to: '/clients/new' },
  { key: 'SUBMITTED', label: 'Submitted', to: '/clients?status=PENDING_ADMIN_APPROVAL' },
  { key: 'ADMIN_REVIEW', label: 'Admin Review', to: '/clients?status=PENDING_ADMIN_APPROVAL' },
  { key: 'APPROVED', label: 'Approved', to: '/clients?status=APPROVED' },
  { key: 'IN_PRODUCTION', label: 'In Production', to: '/projects' },
  { key: 'COMPLETED', label: 'Completed', to: '/projects?status=PUBLISHED' },
]

export function PipelinePage() {
  const navigate = useNavigate()
  const { data: clients, isLoading: lc } = useClients({ limit: 500 })
  const { data: projects, isLoading: lp } = useProjects({ limit: 500 })

  if (lc || lp) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>

  const clientCounts = (status: string) => (clients?.clients ?? []).filter((c) => c.status === status).length
  const projectCounts = (status: string) => (projects?.projects ?? []).filter((p) => p.status === status).length

  const countFor = (key: string) => {
    switch (key) {
      case 'LEAD':
      case 'ONBOARDING':
        return clients?.clients?.length ?? 0
      case 'SUBMITTED':
      case 'ADMIN_REVIEW':
        return clientCounts('PENDING_ADMIN_APPROVAL')
      case 'APPROVED':
        return clientCounts('APPROVED')
      case 'IN_PRODUCTION':
        return projectCounts('ACTIVE')
      case 'COMPLETED':
        return projectCounts('PUBLISHED')
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pipeline" description="Track clients through the full acquisition-to-production lifecycle." image={images.marketingTeam} />
      <div className="flex flex-wrap items-stretch gap-3">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <button onClick={() => navigate(s.to)} className="group w-44 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{countFor(s.key)}</p>
              <p className="mt-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">View →</p>
            </button>
            {i < STAGES.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>
      <Card className="p-5 text-sm text-muted-foreground">
        <TrendingUp className="mb-2 h-5 w-5 text-primary" />
        Click any stage to open the matching list. Marketing hands approved projects to Task Management, who drive them into production.
      </Card>
    </div>
  )
}
