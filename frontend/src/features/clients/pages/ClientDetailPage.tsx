import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Send, FileText, Plus } from 'lucide-react'
import { useClient, useApproveClient, useRejectClient, useSubmitClient } from '../hooks/useClients'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Field'
import { formatDate } from '@/utils/formatDate'

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const { data: client, isLoading, isError, refetch } = useClient(id)

  const approve = useApproveClient()
  const reject = useRejectClient()
  const submit = useSubmitClient()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError || !client) return <ErrorState onRetry={() => refetch()} />

  const canApprove = hasPermission(user?.role, user?.permissions, 'CLIENT_APPROVE')
  const canSubmit = hasPermission(user?.role, user?.permissions, 'CLIENT_SUBMIT')

  const onApprove = async () => {
    await approve.mutateAsync(client._id)
    addToast({ type: 'success', title: 'Client approved' })
  }
  const onReject = async () => {
    await reject.mutateAsync({ id: client._id, reason })
    addToast({ type: 'info', title: 'Client rejected' })
    setRejectOpen(false)
  }
  const onSubmit = async () => {
    await submit.mutateAsync({ id: client._id })
    addToast({ type: 'success', title: 'Submitted for approval' })
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{client.companyName}</h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.clientName ? `${client.clientName} · ` : ''}
            {client.email} · Created {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit && client.status === 'DRAFT' && (
            <Button onClick={onSubmit} loading={submit.isPending}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          )}
          {canApprove && client.status === 'PENDING_ADMIN_APPROVAL' && (
            <>
              <Button variant="success" onClick={onApprove} loading={approve.isPending}>
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <X className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Industry" value={client.industry} />
            <Info label="Phone" value={client.phone} />
            <Info label="WhatsApp" value={client.whatsappNumber} />
            <Info label="Website" value={client.website} />
            <Info label="Address" value={client.address} className="sm:col-span-2" />
            <Info label="Product Information" value={client.productInformation} className="sm:col-span-2" />
            <Info label="Campaign Information" value={client.campaignInformation} className="sm:col-span-2" />
            <Info label="Requirements" value={client.requirements} className="sm:col-span-2" />
            <Info label="Notes" value={client.notes} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {client.documents?.length ? (
              <div className="space-y-2">
                {client.documents.map((d, i) => (
                  <a
                    key={i}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-secondary"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{d.name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject client"
        description="Provide a reason. The client will be notified."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onReject} loading={reject.isPending}>Reject</Button>
          </>
        }
      >
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection..."
          rows={4}
        />
      </Modal>
    </div>
  )
}

function Info({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}
