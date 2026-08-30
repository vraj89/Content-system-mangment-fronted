import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, Check, X, RotateCcw } from 'lucide-react'
import { useApprovals, useApprove, useRejectApproval, useRequestRevision } from '../hooks/useApprovals'
import { useAuth } from '@/features/auth'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Field'
import { images } from '@/assets/images'
import { formatRelative } from '@/utils/formatDate'
import type { Approval } from '../hooks/useApprovals'

export function ApprovalsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useApprovals({ limit: 30 })
  const [review, setReview] = useState<Approval | null>(null)
  const [comment, setComment] = useState('')
  const approve = useApprove()
  const reject = useRejectApproval()
  const revision = useRequestRevision()

  const act = async (type: 'approve' | 'reject' | 'revision') => {
    if (!review) return
    try {
      if (type === 'approve') await approve.mutateAsync({ id: review._id, comment })
      if (type === 'reject') await reject.mutateAsync({ id: review._id, comment })
      if (type === 'revision') await revision.mutateAsync({ id: review._id, comment })
      setReview(null)
      setComment('')
      refetch()
    } catch (e) {
      // keep drawer open on failure; error will be shown via toast by mutation hook or caller
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="Review and action pending approvals across all entities." image={images.dashboardClient} />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.approvals.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.approvals.map((a) => (
            <Card key={a._id} hover className="cursor-pointer p-5" onClick={() => setReview(a)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.entityType}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {a.comment && <p className="mt-2 text-sm text-muted-foreground">{a.comment}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); setReview(a); setComment(''); }}><Check className="h-3.5 w-3.5" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setReview(a); setComment(''); }}><X className="h-3.5 w-3.5" /> Reject</Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setReview(a); setComment(''); }}><RotateCcw className="h-3.5 w-3.5" /> Revision</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<CheckCheck className="h-6 w-6" />} title="No approvals" description="Pending approvals will appear here." />
      )}

      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title="Review Approval"
        description={review ? `${review.entityType} · ${review.status}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setReview(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => act('reject')} loading={reject.isPending}><X className="h-4 w-4" /> Reject</Button>
            <Button variant="outline" onClick={() => act('revision')} loading={revision.isPending}><RotateCcw className="h-4 w-4" /> Request Revision</Button>
            <Button variant="success" onClick={() => act('approve')} loading={approve.isPending}><Check className="h-4 w-4" /> Approve</Button>
          </>
        }
      >
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment (optional)..." rows={4} />
      </Modal>
    </div>
  )
}
