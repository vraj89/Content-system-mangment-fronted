import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FolderKanban, Rocket } from 'lucide-react'
import { useProjects, useCreateProject } from '../hooks/useProjects'
import { useClients } from '@/features/clients/hooks/useClients'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/forms/FormField'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

export function ProjectsListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const debounced = useDebounce(search)

  useEffect(() => setPage(1), [debounced, status])

  const { data, isLoading, isError, refetch } = useProjects({
    search: debounced || undefined,
    status: status || undefined,
    page,
    limit: 10,
  })

  const create = useCreateProject()
  const { data: clientsData } = useClients({ limit: 100 })
  const canCreate = hasPermission(user?.role, user?.permissions, 'PROJECT_VIEW')

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const clientId = String(fd.get('clientId') || '')
    if (!clientId) {
      addToast({ type: 'error', title: 'Client required', description: 'Please select a client for the project.' })
      return
    }
    try {
      const project = await create.mutateAsync({
        clientId,
        name: String(fd.get('name') || ''),
        description: String(fd.get('description') || ''),
        requirements: String(fd.get('requirements') || ''),
        paymentRequired: fd.get('paymentRequired') === 'on',
      })
      addToast({ type: 'success', title: 'Project created' })
      setCreateOpen(false)
      navigate(`/projects/${project._id}`)
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to create project', description: (err as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track every campaign from kickoff to published."
        image={images.dashboardAndClient}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="READY_TO_PUBLISH">Ready to Publish</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={26} /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data?.projects.length ? (
          <div className="divide-y divide-border">
            {data.projects.map((p) => (
              <button
                key={p._id}
                onClick={() => navigate(`/projects/${p._id}`)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-secondary/50 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-sm text-muted-foreground line-clamp-1">{p.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.publishedAt && <Rocket className="h-4 w-4 text-success" />}
                  <StatusBadge status={p.status} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="No projects yet" description="Create a project to organize tasks, content and media." />
        )}

        {data?.meta && <div className="border-t border-border p-4"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Project" description="Start a new campaign project.">
        <form onSubmit={onCreate} className="space-y-4">
          <FormField label="Client" required>
            <Select name="clientId" required data-testid="project-client-select" defaultValue="">
              <option value="">Select client *</option>
              {(clientsData?.clients ?? []).map((c) => (
                <option key={c._id} value={c._id}>{c.companyName} — {c.email}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Project Name" required>
            <Input name="name" required placeholder="Spring Launch 2026" />
          </FormField>
          <FormField label="Description">
            <textarea name="description" className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="What is this project about?" />
          </FormField>
          <FormField label="Requirements">
            <textarea name="requirements" className="flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Client requirements..." />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="paymentRequired" className="h-4 w-4 rounded border-input" /> Payment required to publish
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending} data-testid="project-create-submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
