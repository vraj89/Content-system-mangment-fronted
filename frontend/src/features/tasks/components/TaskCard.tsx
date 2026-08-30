import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/utils/formatDate'
import { CalendarClock } from 'lucide-react'
import type { Task } from '../hooks/useTasks'

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const assigneeName = typeof task.assignedTo === 'object' && task.assignedTo ? task.assignedTo.name : (task.assignedTo ?? 'Unassigned')
  return (
    <Card hover className="cursor-pointer p-4" onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
        <StatusBadge status={task.priority} />
      </div>
      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={assigneeName} size="sm" />
          <span className="text-xs text-muted-foreground">{assigneeName === 'Unassigned' ? 'Unassigned' : 'Assigned'}</span>
        </div>
        {task.dueDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </Card>
  )
}
