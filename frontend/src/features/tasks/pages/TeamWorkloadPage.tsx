import { Users2 } from 'lucide-react'
import { useTaskWorkload } from '../hooks/useTasks'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { images } from '@/assets/images'

function workloadLevel(load: number): { label: string; tone: 'success' | 'accent' | 'warning' | 'danger' } {
  if (load <= 2) return { label: 'Low', tone: 'success' }
  if (load <= 4) return { label: 'Normal', tone: 'accent' }
  if (load <= 6) return { label: 'High', tone: 'warning' }
  return { label: 'Overloaded', tone: 'danger' }
}

export function TeamWorkloadPage() {
  const { data, isLoading, isError, refetch } = useTaskWorkload()

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError) return <EmptyState title="Could not load workload" action={<button onClick={() => refetch()}>Retry</button>} />

  const workload = data?.workload ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Team Workload" description="Monitor capacity across Content and Media teams. Reassign from overloaded members." image={images.adminSquad} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Assigned</th>
                <th className="px-4 py-3 text-right">In Progress</th>
                <th className="px-4 py-3 text-right">Overdue</th>
                <th className="px-4 py-3 text-right">Completed</th>
                <th className="px-4 py-3">Workload</th>
              </tr>
            </thead>
            <tbody>
              {workload.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No team data</td></tr>
              )}
              {workload.map((m) => {
                const level = workloadLevel(m.currentLoad)
                return (
                  <tr key={m.member._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{m.member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.member.role}</td>
                    <td className="px-4 py-3 text-right">{m.assigned}</td>
                    <td className="px-4 py-3 text-right">{m.active}</td>
                    <td className="px-4 py-3 text-right">{m.overdue}</td>
                    <td className="px-4 py-3 text-right">{m.completed}</td>
                    <td className="px-4 py-3"><Badge tone={level.tone}>{level.label}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data && data.overdueTasks.length > 0 && (
          <div className="border-t border-border p-4">
            <p className="mb-2 text-sm font-semibold text-rose-600">{data.overdueTasks.length} overdue task(s) need attention</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {data.overdueTasks.slice(0, 5).map((t) => (
                <li key={t._id}>• {t.title} — due {new Date(t.dueDate ?? '').toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}
