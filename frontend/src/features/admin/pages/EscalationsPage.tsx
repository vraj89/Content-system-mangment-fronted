import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { Button } from '@/components/ui/Button'
import { useRevisions } from '@/features/revisions/hooks/useRevisions'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

export function EscalationsPage() {
  const navigate = useNavigate()
  const { data: tasksData, isLoading: lt } = useTasks({ limit: 300 })
  const { data: revData, isLoading: lr } = useRevisions({ limit: 100 })
  const now = new Date()

  if (lt || lr) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>

  const overdue = (tasksData?.tasks ?? [])
    .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .map((t) => ({ kind: 'Overdue Task', project: t.title, priority: t.priority, status: t.status, date: t.dueDate!, raw: t }))
  const openRevs = (revData?.revisions ?? [])
    .filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS')
    .map((r) => ({ kind: 'Revision Request', project: r.entityType, priority: r.priority ?? 'MEDIUM', status: r.status, date: r.createdAt, raw: r }))

  const items = [...overdue, ...openRevs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-6">
      <PageHeader title="Escalations" description="Urgent issues requiring Admin attention: overdue tasks and open revisions." image={images.dashboardClient} />
      {items.length === 0 ? (
        <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No active escalations" description="Everything is under control." />
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="font-medium">{it.kind}</p>
                  <p className="text-xs text-muted-foreground">{it.project} · {formatDate(it.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={it.priority} />
                  <StatusBadge status={it.status} />
                  <Button variant="ghost" onClick={() => navigate('/tasks')}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
