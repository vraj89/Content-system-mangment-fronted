import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

export function OverdueTasksPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useTasks({ limit: 300 })
  const now = new Date()
  const overdue = (data?.tasks ?? [])
    .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError) return <EmptyState title="Could not load tasks" action={<button onClick={() => refetch()}>Retry</button>} />

  return (
    <div className="space-y-6">
      <PageHeader title="Overdue Tasks" description="Tasks past their deadline that still need action." image={images.adminSquad} />
      <Card>
        {overdue.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Nothing overdue" description="All tasks are on schedule." />
        ) : (
          <div className="divide-y divide-border">
            {overdue.map((t) => {
              const days = Math.ceil((now.getTime() - new Date(t.dueDate!).getTime()) / 86400000)
              return (
                <button key={t._id} onClick={() => navigate('/tasks')} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-secondary/50">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(t.dueDate!)} · {days} day(s) overdue</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useTasks({ limit: 300 })
  const [filter, setFilter] = useState('UPCOMING')
  const tasks = data?.tasks ?? []
  const now = new Date()
  const visible = tasks
    .filter((t) => t.dueDate)
    .filter((t) => (filter === 'UPCOMING' ? new Date(t.dueDate!) >= now : new Date(t.dueDate!) < now))
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Upcoming and past task deadlines." image={images.adminSquad} />
      <div className="flex gap-2">
        {(['UPCOMING', 'PAST'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg border px-3 py-1.5 text-sm ${filter === f ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
            {f === 'UPCOMING' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>
      <Card>
        <div className="divide-y divide-border">
          {visible.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks</p>}
          {visible.map((t) => (
            <button key={t._id} onClick={() => navigate('/tasks')} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(t.dueDate!)}</span>
                <StatusBadge status={t.status} />
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
