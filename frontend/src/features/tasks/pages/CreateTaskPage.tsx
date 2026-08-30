import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListTodo } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useCreateTask } from '../hooks/useTasks'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select, Label } from '@/components/ui/Field'
import { FormField } from '@/components/forms/FormField'
import { images } from '@/assets/images'

const TASK_TYPES = ['CONTENT', 'MEDIA', 'REVIEW', 'REVISION', 'CLIENT_APPROVAL', 'ADMIN_APPROVAL', 'PUBLISHING']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const TEAMS = ['CONTENT_TEAM', 'MEDIA_TEAM', 'TASK_MANAGEMENT']

export function CreateTaskPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const create = useCreateTask()
  const { data: projectsData } = useProjects({ limit: 100 })
  const { data: usersData } = useUsers({ limit: 100 })
  const projects = projectsData?.projects ?? []
  const members = usersData?.users ?? []

  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    taskType: 'CONTENT',
    assignedTeam: 'CONTENT_TEAM',
    assignedTo: '',
    priority: 'MEDIUM',
    startDate: '',
    dueDate: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const toISODate = (d: string) => (d ? new Date(d + 'T00:00:00.000Z').toISOString() : undefined)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      addToast({ type: 'error', title: 'Task title is required' })
      return
    }
    if (!form.projectId) {
      addToast({ type: 'error', title: 'Project is required', description: 'Please select a project.' })
      return
    }
    try {
      const created = await create.mutateAsync({
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        projectId: form.projectId,
        taskType: form.taskType,
        assignedTeam: form.assignedTeam || undefined,
        assignedTo: form.assignedTo || undefined,
        priority: form.priority as never,
        startDate: toISODate(form.startDate),
        dueDate: toISODate(form.dueDate),
      })
      addToast({ type: 'success', title: 'Task created' })
      navigate(`/tasks?team=${form.assignedTeam}`)
    } catch (err) {
      addToast({ type: 'error', title: 'Could not create task', description: (err as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Task" description="Break an approved project into an actionable production task." image={images.adminSquad} />
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Task Title" required><Input value={form.title} onChange={set('title')} required placeholder="e.g. Write Instagram campaign copy" /></FormField>
            <FormField label="Description"><Textarea value={form.description} onChange={set('description')} rows={4} placeholder="What needs to be produced?" /></FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Project" required>
                <Select value={form.projectId} onChange={set('projectId')} required>
                  <option value="">Select project…</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Task Type">
                <Select value={form.taskType} onChange={set('taskType')}>
                  {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Team">
                <Select value={form.assignedTeam} onChange={set('assignedTeam')}>
                  {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </FormField>
              <FormField label="Assign Member">
                <Select value={form.assignedTo} onChange={set('assignedTo')}>
                  <option value="">Unassigned</option>
                  {members.filter((m) => m.role === form.assignedTeam || m.role === 'TASK_MANAGEMENT').map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Priority">
                <Select value={form.priority} onChange={set('priority')}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormField>
              <FormField label="Start Date"><Input type="date" value={form.startDate} onChange={set('startDate')} /></FormField>
              <FormField label="Deadline"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></FormField>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={create.isPending}><ListTodo className="h-4 w-4" /> Create & Assign</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/tasks')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scheduling Tips</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Set a realistic deadline so the system can flag overdue items automatically.</p>
            <p>Tasks assigned to <span className="font-medium text-foreground">CONTENT_TEAM</span> or <span className="font-medium text-foreground">MEDIA_TEAM</span> appear on their dashboards.</p>
            <p>Leave <span className="font-medium text-foreground">Assign Member</span> empty to keep the task in the pending pool for later assignment.</p>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
