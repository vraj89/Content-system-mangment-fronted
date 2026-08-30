import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, CheckCircle2 } from 'lucide-react'
import { useProjects, usePublishProject } from '@/features/projects/hooks/useProjects'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { images } from '@/assets/images'

export function ReadyToPublishPage() {
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const publish = usePublishProject()
  const { data, isLoading, isError, refetch } = useProjects({ status: 'READY_TO_PUBLISH', limit: 100 })
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const projects = data?.projects ?? []

  const doPublish = async () => {
    if (!confirmId) return
    try {
      await publish.mutateAsync({ id: confirmId })
      addToast({ type: 'success', title: 'Project published' })
      setConfirmId(null)
      refetch()
    } catch (err) {
      addToast({ type: 'error', title: 'Publish failed', description: (err as Error).message })
    }
  }

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError) return <EmptyState title="Could not load projects" action={<button onClick={() => refetch()}>Retry</button>} />

  return (
    <div className="space-y-6">
      <PageHeader title="Ready to Publish" description="Projects where content, media and client approval are complete." image={images.dashboardClient} />
      {projects.length === 0 ? (
        <EmptyState icon={<Rocket className="h-6 w-6" />} title="Nothing ready to publish" description="Approved projects awaiting final publish will appear here." />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Card key={p._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={p.status} />
                  <span>Client: <StatusBadge status={p.clientApproved ? 'APPROVED' : 'PENDING'} /></span>
                  <span>Admin: <StatusBadge status={p.adminApproved ? 'APPROVED' : 'PENDING'} /></span>
                  {p.paymentRequired !== undefined && <span>Payment: <StatusBadge status={p.paymentSatisfied ? 'PAID' : 'UNPAID'} /></span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/projects/${p._id}`)}>View</Button>
                <Button onClick={() => setConfirmId(p._id)} loading={publish.isPending && confirmId === p._id}>
                  <CheckCircle2 className="h-4 w-4" /> Approve & Publish
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Confirm Publish" description="Are you sure you want to publish this project? This makes it visible to the client as completed.">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
          <Button onClick={doPublish} loading={publish.isPending}>Confirm Publish</Button>
        </div>
      </Modal>
    </div>
  )
}
