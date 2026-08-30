import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, FileText } from 'lucide-react'
import { useContent, useCreateContent } from '../hooks/useContent'
import { useProjects } from '@/features/projects/hooks/useProjects'
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

export function ContentListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const debounced = useDebounce(search)
  useEffect(() => setPage(1), [debounced, status])

  const { data, isLoading, isError, refetch } = useContent({
    search: debounced || undefined,
    status: status || undefined,
    page,
    limit: 10,
  })
  const { data: projectsData } = useProjects({ limit: 100 })
  const projects = projectsData?.projects ?? []
  const create = useCreateContent()
  const canCreate = hasPermission(user?.role, user?.permissions, 'CONTENT_CREATE')

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const projectId = String(fd.get('projectId') || '') || undefined
    if (!projectId) {
      addToast({ type: 'error', title: 'Select a project to continue' })
      return
    }
    try {
      const item = await create.mutateAsync({
        title: String(fd.get('title') || ''),
        shortDescription: String(fd.get('shortDescription') || '') || undefined,
        longDescription: String(fd.get('longDescription') || '') || undefined,
        projectId,
      })
      addToast({ type: 'success', title: 'Content created' })
      setCreateOpen(false)
      navigate(`/content/${item._id}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create content'
      addToast({ type: 'error', title: 'Could not create content', description: message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Author, submit and review content with full version history."
        image={images.contentWriting}
        actions={canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Content</Button> : undefined}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="APPROVED">Approved</option>
          </Select>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={26} /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data?.content.length ? (
          <div className="divide-y divide-border">
            {data.content.map((c) => (
              <button key={c._id} onClick={() => navigate(`/content/${c._id}`)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-secondary/50 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.shortDescription || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">v{c.currentVersion}</span>
                  <StatusBadge status={c.status} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={<FileText className="h-6 w-6" />} title="No content yet" description="Create content to begin the review workflow." />
        )}
        {data?.meta && <div className="border-t border-border p-4"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Content" description="Draft a new content piece.">
        <form onSubmit={onCreate} className="space-y-4">
          <FormField label="Title" required><Input name="title" required placeholder="Post title" /></FormField>
          <FormField label="Short Description"><Input name="shortDescription" placeholder="One-line summary" /></FormField>
          <FormField label="Long Description"><textarea name="longDescription" rows={3} className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormField>
          <FormField label="Project" required hint="Content is linked to a project">
            <Select name="projectId" required defaultValue="">
              <option value="" disabled>Select a project…</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
