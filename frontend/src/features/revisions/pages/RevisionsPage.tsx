import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitPullRequestArrow, Check, Plus, Search } from 'lucide-react'
import { useRevisions, useCreateRevision, useResolveRevision, useUpdateRevision } from '../hooks/useRevisions'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/forms/FormField'
import { images } from '@/assets/images'
import { formatRelative } from '@/utils/formatDate'

export function RevisionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(search)
  useEffect(() => {}, [debounced, status])

  const { data, isLoading, isError, refetch } = useRevisions({ search: debounced || undefined, status: status || undefined, limit: 30 })
  const create = useCreateRevision()
  const resolve = useResolveRevision()
  const update = useUpdateRevision('')
  const canCreate = hasPermission(user?.role, user?.permissions, 'CONTENT_EDIT')

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await create.mutateAsync({
      entityType: String(fd.get('entityType') || 'CONTENT'),
      entityId: String(fd.get('entityId') || ''),
      reason: String(fd.get('reason') || ''),
      priority: (fd.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
      projectId: String(fd.get('projectId') || '') || undefined,
    })
    addToast({ type: 'success', title: 'Revision requested' })
    setOpen(false)
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Revisions" description="Track and resolve revision requests." image={images.dashboardAndClient}
        actions={canCreate ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Request</Button> : undefined}
      />
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search revisions..." className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.revisions.length ? (
        <div className="space-y-3">
          {data.revisions.map((r) => (
            <Card key={r._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{r.entityType}</span>
                    <StatusBadge status={r.priority} />
                  </div>
                  <p className="mt-1 text-sm text-foreground">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelative(r.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} />
                  {r.status !== 'RESOLVED' && r.status !== 'CLOSED' && (
                    <Button size="sm" variant="success" onClick={() => resolve.mutate(r._id)} loading={resolve.isPending}>
                      <Check className="h-3.5 w-3.5" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<GitPullRequestArrow className="h-6 w-6" />} title="No revision requests" description="Everything is currently approved." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Request Revision" description="Open a new revision request.">
        <form onSubmit={onCreate} className="space-y-4">
          <FormField label="Entity Type"><Select name="entityType" defaultValue="CONTENT"><option>CONTENT</option><option>MEDIA</option><option>PROJECT</option><option>TASK</option></Select></FormField>
          <FormField label="Entity ID" required><Input name="entityId" required placeholder="ID of the item" /></FormField>
          <FormField label="Project ID"><Input name="projectId" placeholder="Optional" /></FormField>
          <FormField label="Reason" required><Textarea name="reason" required rows={3} placeholder="What needs to change?" /></FormField>
          <FormField label="Priority"><Select name="priority" defaultValue="MEDIUM"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></Select></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
