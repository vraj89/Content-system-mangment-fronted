import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { KanbanSquare, ChevronRight, GripVertical } from 'lucide-react'
import { useTasks, useTaskStatus } from '../hooks/useTasks'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { images } from '@/assets/images'
import type { Task, TaskStatus } from '../api/tasks.api'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'Pending' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW', label: 'Under Review' },
  { status: 'BLOCKED', label: 'Blocked' },
  { status: 'COMPLETED', label: 'Completed' },
]

const NEXT: Record<TaskStatus, TaskStatus | null> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'IN_REVIEW',
  IN_REVIEW: 'COMPLETED',
  BLOCKED: 'IN_PROGRESS',
  COMPLETED: null,
  CANCELLED: null,
}

function memberName(a?: Task['assignedTo']) {
  if (!a) return 'Unassigned'
  return typeof a === 'string' ? 'Unassigned' : a.name
}

export function KanbanPage() {
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const status = useTaskStatus()
  const { data, isLoading } = useTasks({ limit: 200 })
  const tasks = data?.tasks ?? []
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const dragTaskRef = useRef<Task | null>(null)

  const move = async (t: Task, to: TaskStatus) => {
    if (t.status === to) return
    try {
      await status.mutateAsync({ id: t._id, status: to })
      addToast({ type: 'success', title: 'Status updated', description: `${t.title} → ${to}` })
    } catch (err) {
      addToast({ type: 'error', title: 'Update failed', description: (err as Error).message })
    }
  }

  const onDragStart = (e: React.DragEvent, task: Task) => {
    dragTaskRef.current = task
    setDraggedId(task._id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task._id)
    // Custom drag image handled by browser; keep semi-transparent card
  }

  const onDragEnd = () => {
    setDraggedId(null)
    setDragOverStatus(null)
    dragTaskRef.current = null
  }

  const onDragOver = (e: React.DragEvent, colStatus: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStatus !== colStatus) setDragOverStatus(colStatus)
  }

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column container, not a child
    const related = e.relatedTarget as HTMLElement | null
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverStatus(null)
    }
  }

  const onDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const task = dragTaskRef.current
    setDragOverStatus(null)
    setDraggedId(null)
    if (!task) return
    if (task.status === targetStatus) {
      dragTaskRef.current = null
      return
    }
    dragTaskRef.current = null
    await move(task, targetStatus)
  }

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Kanban Board" description="Drag and drop tasks between columns — or use Move as fallback. Status persists via API." image={images.adminSquad} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status)
          const isDragOver = dragOverStatus === col.status
          return (
            <Card key={col.status} className={`flex flex-col transition-colors ${isDragOver ? 'ring-2 ring-primary ring-offset-1 bg-primary/5' : ''}`}>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{colTasks.length}</span>
              </div>
              <div
                className={`flex-1 space-y-3 p-3 min-h-[120px] transition-colors ${isDragOver ? 'bg-primary/5' : ''}`}
                onDragOver={(e) => onDragOver(e, col.status)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, col.status)}
                data-testid={`kanban-column-${col.status}`}
                data-status={col.status}
              >
                {colTasks.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    {isDragOver ? 'Drop here' : 'No tasks'}
                  </p>
                )}
                {colTasks.map((t) => {
                  const isDragging = draggedId === t._id
                  return (
                    <div
                      key={t._id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t)}
                      onDragEnd={onDragEnd}
                      data-testid={`kanban-card-${t._id}`}
                      data-task-status={t.status}
                      className={`rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing transition-all select-none ${isDragging ? 'opacity-50 scale-[0.98] border-primary shadow-md' : 'hover:shadow-sm hover:border-primary/30'}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        <button onClick={() => navigate('/tasks')} className="block flex-1 text-left text-sm font-medium hover:text-primary line-clamp-2">{t.title}</button>
                      </div>
                      <p className="mt-1 ml-5 text-xs text-muted-foreground">{memberName(t.assignedTo)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={t.priority} />
                        {NEXT[col.status] && (
                          <Button size="sm" variant="ghost" onClick={() => move(t, NEXT[col.status]!)}>
                            Move <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
