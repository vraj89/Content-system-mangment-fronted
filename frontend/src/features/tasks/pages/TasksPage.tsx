import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List as ListIcon, CalendarClock, AlertTriangle, Users, Link2 } from 'lucide-react'
import { useTasks, useCreateTask, useTaskStatus, useUpdateTask, useAssignTask, useTaskWorkload, type Task, type TaskStatus, type TaskPriority } from '../hooks/useTasks'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { useUIStore } from '@/stores/ui.store'
import { hasPermission } from '@/lib/permissions'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/forms/FormField'
import { TaskCard } from '../components/TaskCard'
import { CommentsThread } from '@/features/comments/components/CommentsThread'
import { images } from '@/assets/images'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants'
import { formatDate } from '@/utils/formatDate'

const TEAM_OPTIONS = ['CONTENT_TEAM', 'MEDIA_TEAM'] as const

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'BLOCKED', label: 'Blocked' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'COMPLETED', label: 'Completed' },
]

const assigneeName = (t: Task) =>
  typeof t.assignedTo === 'object' && t.assignedTo ? t.assignedTo.name : (t.assignedTo ?? 'Unassigned')

export function TasksPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [teamFilter, setTeamFilter] = useState(searchParams.get('team') ?? '')
  const assigneeMe = searchParams.get('assignee') === 'me' ? user?._id : undefined
  const [view, setView] = useState<'board' | 'list'>('board')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)
  const debounced = useDebounce(search)
  const { data, isLoading, isError, refetch } = useTasks({
    search: debounced || undefined,
    priority: priority || undefined,
    status: statusFilter || undefined,
    assignedTeam: teamFilter || undefined,
    assignedTo: assigneeMe || undefined,
    limit: 200,
  })
  const { data: workload } = useTaskWorkload()
  const create = useCreateTask()
  const canCreate = hasPermission(user?.role, user?.permissions, 'TASK_CREATE')

  const tasks = data?.tasks ?? []

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'),
    [tasks],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Management"
        description="Plan, assign and track work across Content and Media teams."
        image={images.dashboardAndClient}
        actions={
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${view === 'board' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" /> Board
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${view === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <ListIcon className="h-4 w-4" /> List
              </button>
            </div>
            {canCreate && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Create Task
              </Button>
            )}
          </div>
        }
      />

      {overdueTasks.length > 0 && (
        <Card className="flex items-center gap-3 border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">{overdueTasks.length} overdue task(s)</p>
            <p className="text-xs text-muted-foreground">Review and reassign blocked or late tasks to keep delivery on track.</p>
          </div>
          <Button variant="outline" onClick={() => setStatusFilter('')}>
            View all
          </Button>
        </Card>
      )}

      {workload?.workload && workload.workload.length > 0 && (
        <TeamWorkload workload={workload.workload} unassigned={workload.unassignedTasks} />
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9" />
          </div>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-44">
            <option value="">All priorities</option>
            {TASK_PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="">All statuses</option>
            {TASK_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="sm:w-44">
            <option value="">All teams</option>
            {TEAM_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : tasks.length === 0 ? (
        <EmptyState icon={<ListIcon className="h-6 w-6" />} title="No tasks found" description="Create a task to get started." />
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status)
            return (
              <div key={col.status} className="space-y-3 rounded-xl bg-secondary/40 p-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{colTasks.length}</span>
                </div>
                {colTasks.map((t) => (
                  <TaskCard key={t._id} task={t} onClick={() => setSelected(t)} />
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {tasks.map((t) => (
              <button
                key={t._id}
                onClick={() => setSelected(t)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{assigneeName(t)} · {t.taskType ?? 'CONTENT'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(t.dueDate)}
                    </span>
                  )}
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {createOpen && (
        <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
      {selected && (
        <TaskDetailDrawer task={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function TeamWorkload({ workload, unassigned }: { workload: import('../api/tasks.api').WorkloadMember[]; unassigned: number }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Team Workload</h3>
        {unassigned > 0 && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">{unassigned} unassigned</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-4">Member</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Assigned</th>
              <th className="py-2 pr-4">Active</th>
              <th className="py-2 pr-4">Completed</th>
              <th className="py-2 pr-4">Overdue</th>
              <th className="py-2">Current Load</th>
            </tr>
          </thead>
          <tbody>
            {workload.map((w) => (
              <tr key={w.member._id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium text-foreground">{w.member.name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{w.member.role}</td>
                <td className="py-2 pr-4">{w.assigned}</td>
                <td className="py-2 pr-4">{w.active}</td>
                <td className="py-2 pr-4">{w.completed}</td>
                <td className="py-2 pr-4">
                  {w.overdue > 0 ? <span className="text-destructive">{w.overdue}</span> : w.overdue}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(100, w.currentLoad * 20)} className="w-24" />
                    <span className="text-xs text-muted-foreground">{w.currentLoad}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const create = useCreateTask()
  const { data: projects, isLoading: projectsLoading } = useProjects({ limit: 100 })
  const { data: users, isLoading: usersLoading } = useUsers({ limit: 200 })
  const { data: tasksData } = useTasks({ limit: 200 })
  const [team, setTeam] = useState('')

  const members = (users?.users ?? []).filter((u) => (team ? u.role === team : ['CONTENT_TEAM', 'MEDIA_TEAM'].includes(u.role as never)))
  const projectOptions = projects?.projects ?? []
  const taskOptions = tasksData?.tasks ?? []

  const toISODate = (v: FormDataEntryValue | null) => {
    if (!v) return undefined
    const s = String(v).trim()
    if (!s) return undefined
    const d = new Date(s + 'T00:00:00.000Z')
    return isNaN(d.getTime()) ? undefined : d.toISOString()
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get('title') || '').trim()
    const projectId = String(fd.get('projectId') || '').trim()
    if (!title) {
      addToast({ type: 'error', title: 'Task title is required' })
      return
    }
    if (!projectId) {
      addToast({ type: 'error', title: 'Project is required', description: 'Please select a project.' })
      return
    }
    const dependencies = Array.from(fd.getAll('dependencies')).map(String).filter(Boolean)
    await create.mutateAsync({
      title,
      description: String(fd.get('description') || '').trim() || undefined,
      projectId,
      taskType: String(fd.get('taskType') || 'CONTENT'),
      priority: (fd.get('priority') as TaskPriority) || 'MEDIUM',
      status: (fd.get('status') as TaskStatus) || 'TODO',
      assignedTeam: String(fd.get('assignedTeam') || '').trim() || undefined,
      assignedTo: String(fd.get('assignedTo') || '').trim() || undefined,
      startDate: toISODate(fd.get('startDate')),
      dueDate: toISODate(fd.get('dueDate')),
      estimatedHours: fd.get('estimatedHours') ? Number(fd.get('estimatedHours')) : undefined,
      dependencies: dependencies.length ? dependencies : undefined,
    })
      .then(() => {
        addToast({ type: 'success', title: 'Task created' })
        onClose()
      })
      .catch((err: Error) => {
        addToast({
          type: 'error',
          title: 'Could not create task',
          description: err.message || 'Please check the form and try again.',
        })
      })
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Task" description="Create and assign a task to a team member.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Title" required>
          <Input name="title" required placeholder="Design homepage hero" />
        </FormField>
        <FormField label="Description">
          <textarea name="description" rows={3} className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Project" required>
            <Select name="projectId" required disabled={projectsLoading}>
              <option value="">{projectsLoading ? 'Loading projects...' : 'Select project'}</option>
              {projectOptions.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </Select>
            {!projectsLoading && projectOptions.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No projects available — create a project first.</p>
            )}
          </FormField>
          <FormField label="Task Type">
            <Select name="taskType" defaultValue="CONTENT">
              {TASK_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Assigned Team">
            <Select name="assignedTeam" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Select team</option>
              {TEAM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Assignee" hint="Pick a team member">
            <Select name="assignedTo">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Dependencies" hint="Tasks that must be completed first">
          <select name="dependencies" multiple className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {taskOptions.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Priority">
            <Select name="priority" defaultValue="MEDIUM">
              {TASK_PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </FormField>
          <FormField label="Start Date">
            <Input type="date" name="startDate" />
          </FormField>
          <FormField label="Due Date">
            <Input type="date" name="dueDate" />
          </FormField>
        </div>
        <FormField label="Estimated Hours">
          <Input type="number" name="estimatedHours" min={0} step={0.5} placeholder="0" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

function TaskDetailDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const status = useTaskStatus()
  const update = useUpdateTask(task._id)
  const assign = useAssignTask()
  const addToast = useUIStore((s) => s.addToast)
  const { data: users } = useUsers({ limit: 200 })
  const [statusLocal, setStatusLocal] = useState(task.status)
  const [priorityLocal, setPriorityLocal] = useState(task.priority)
  const [team, setTeam] = useState(task.assignedTeam ?? '')
  const [assignee, setAssignee] = useState(
    typeof task.assignedTo === 'object' && task.assignedTo ? task.assignedTo._id : (typeof task.assignedTo === 'string' ? task.assignedTo : ''),
  )

  const members = (users?.users ?? []).filter((u) => (team ? u.role === team : ['CONTENT_TEAM', 'MEDIA_TEAM'].includes(u.role as never)))

  const prevStatus = task.status
  const prevPriority = task.priority
  const changeStatus = async (s: TaskStatus) => {
    setStatusLocal(s)
    try {
      await status.mutateAsync({ id: task._id, status: s })
      addToast({ type: 'success', title: 'Status updated' })
    } catch (err) {
      setStatusLocal(prevStatus)
      addToast({ type: 'error', title: 'Status update failed', description: (err as Error).message })
    }
  }
  const changePriority = async (p: Task['priority']) => {
    setPriorityLocal(p)
    try {
      await update.mutateAsync({ priority: p })
      addToast({ type: 'success', title: 'Priority updated' })
    } catch (err) {
      setPriorityLocal(prevPriority)
      addToast({ type: 'error', title: 'Update failed', description: (err as Error).message })
    }
  }
  const reassign = async () => {
    try {
      await assign.mutateAsync({ id: task._id, assignedTo: assignee, assignedTeam: team || undefined })
      addToast({ type: 'success', title: 'Task reassigned' })
    } catch (err) {
      addToast({ type: 'error', title: 'Reassign failed', description: (err as Error).message })
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={task.title}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={statusLocal} />
          <StatusBadge status={priorityLocal} />
          {task.taskType && <StatusBadge status={task.taskType} />}
        </div>
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

        {task.dependencies && task.dependencies.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Link2 className="mt-0.5 h-4 w-4" />
            <span>Depends on {task.dependencies.length} task(s)</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Status">
            <Select value={statusLocal} onChange={(e) => changeStatus(e.target.value as TaskStatus)}>
              {TASK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Priority">
            <Select value={priorityLocal} onChange={(e) => changePriority(e.target.value as Task['priority'])}>
              {TASK_PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </FormField>
        </div>

        <div className="rounded-lg border border-border p-3">
          <h4 className="mb-2 text-sm font-semibold">Assignment</h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Team">
              <Select value={team} onChange={(e) => setTeam(e.target.value)}>
                <option value="">Select team</option>
                {TEAM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Member">
              <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </Select>
            </FormField>
          </div>
          <Button variant="outline" className="mt-2" onClick={reassign} loading={assign.isPending}>
            Reassign
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {task.startDate && <p>Start: {formatDate(task.startDate)}</p>}
          {task.dueDate && <p>Due: {formatDate(task.dueDate)}</p>}
          {task.projectId && typeof task.projectId === 'object' && 'name' in task.projectId && (
            <p>Project: {(task.projectId as { name: string }).name}</p>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Comments & Activity</h4>
          <CommentsThread
            entityType="TASK"
            entityId={task._id}
            projectId={typeof task.projectId === 'string' ? task.projectId : undefined}
          />
        </div>
      </div>
    </Drawer>
  )
}
