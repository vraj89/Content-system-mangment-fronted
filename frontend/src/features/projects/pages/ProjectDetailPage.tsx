import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Rocket, Check, X, FolderKanban, Package, ListTodo, FileText, Image as ImageIcon, CheckCheck, GitPullRequestArrow, CreditCard } from 'lucide-react'
import { useProject, usePublishProject, useClientApprove, useClientRevision } from '../hooks/useProjects'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useContent } from '@/features/content/hooks/useContent'
import { useMedia } from '@/features/media/hooks/useMedia'
import { useApprovals } from '@/features/approvals/hooks/useApprovals'
import { useRevisions } from '@/features/revisions/hooks/useRevisions'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Field'
import { CommentsThread } from '@/features/comments/components/CommentsThread'
import { Progress } from '@/components/ui/Progress'
import { formatDate } from '@/utils/formatDate'
import { images } from '@/assets/images'

const STAGES = ['CLIENT', 'PROJECT', 'TASKS', 'CONTENT', 'MEDIA', 'CLIENT_REVIEW', 'PAYMENT', 'PUBLISH']

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [tab, setTab] = useState('overview')
  const [publishOpen, setPublishOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')

  const { data: project, isLoading, isError, refetch } = useProject(id)
  const products = useProducts({ projectId: id, limit: 50 })
  const tasks = useTasks({ projectId: id, limit: 50 })
  const content = useContent({ projectId: id, limit: 50 })
  const media = useMedia({ projectId: id, limit: 50 })
  const approvals = useApprovals({ projectId: id, limit: 50 })
  const revisions = useRevisions({ projectId: id, limit: 50 })
  const payments = usePayments({ projectId: id, limit: 50 })

  const publish = usePublishProject()
  const clientApprove = useClientApprove()
  const clientRevision = useClientRevision()

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError || !project) return <ErrorState onRetry={() => refetch()} />

  const isClient = user?.role === 'CLIENT'
  const isAdmin = hasPermission(user?.role, user?.permissions, 'PROJECT_PUBLISH')
  const canApproveClient = isClient && !project.clientApproved
  const canRevisionClient = isClient && project.clientApproved

  const counts = {
    products: products.data?.products.length ?? 0,
    tasks: tasks.data?.tasks.length ?? 0,
    content: content.data?.content.length ?? 0,
    media: media.data?.media.length ?? 0,
    approvals: approvals.data?.approvals.length ?? 0,
    revisions: revisions.data?.revisions.length ?? 0,
    payments: payments.data?.payments.length ?? 0,
  }

  const onPublish = async () => {
    await publish.mutateAsync({ id })
    addToast({ type: 'success', title: 'Project published' })
    setPublishOpen(false)
  }
  const onClientApprove = async () => {
    await clientApprove.mutateAsync(id)
    addToast({ type: 'success', title: 'Project approved' })
  }
  const onClientRevision = async () => {
    await clientRevision.mutateAsync({ id, note: revisionNote })
    addToast({ type: 'info', title: 'Revision requested' })
    setRevisionOpen(false)
  }

  const tabs = [
    { value: 'overview', label: 'Overview', count: undefined },
    { value: 'content', label: 'Content', count: counts.content },
    { value: 'media', label: 'Media', count: counts.media },
    { value: 'approvals', label: 'Approvals', count: counts.approvals },
    { value: 'revisions', label: 'Revisions', count: counts.revisions },
    { value: 'payments', label: 'Payments', count: counts.payments },
  ]

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="relative overflow-hidden rounded-2xl">
        <img src={images.dashboardAndClient} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="mt-1.5 max-w-2xl text-sm text-white/80">{project.description || 'No description provided.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canApproveClient && <Button variant="success" onClick={onClientApprove} loading={clientApprove.isPending}><Check className="h-4 w-4" /> Approve Project</Button>}
              {canRevisionClient && <Button variant="outline" onClick={() => setRevisionOpen(true)}><X className="h-4 w-4" /> Request Revision</Button>}
              {isAdmin && project.status !== 'PUBLISHED' && (
                <Button onClick={() => setPublishOpen(true)} loading={publish.isPending}><Rocket className="h-4 w-4" /> Publish</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <WorkflowStepper
        stages={STAGES}
        state={{
          client: project.clientApproved,
          project: project.status !== 'DRAFT',
          tasks: counts.tasks > 0,
          content: counts.content > 0,
          media: counts.media > 0,
          review: project.adminApproved,
          payment: !project.paymentRequired || project.paymentSatisfied,
          publish: project.status === 'PUBLISHED',
        }}
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Products ({counts.products})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {products.data?.products.map((p) => <div key={p._id} className="rounded-lg border border-border p-3 text-sm">{p.name}</div>)}
              {!counts.products && <p className="text-sm text-muted-foreground">No products yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ListTodo className="h-4 w-4" /> Tasks ({counts.tasks})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tasks.data?.tasks.map((t) => (
                <div key={t._id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span className="truncate">{t.title}</span><StatusBadge status={t.status} />
                </div>
              ))}
              {!counts.tasks && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payments ({counts.payments})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {payments.data?.payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span>{p.invoiceNumber}</span><StatusBadge status={p.paymentStatus} />
                </div>
              ))}
              {!counts.payments && <p className="text-sm text-muted-foreground">No payments yet.</p>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Discussion</CardTitle></CardHeader>
            <CardContent><CommentsThread entityType="PROJECT" entityId={project._id} projectId={project._id} /></CardContent>
          </Card>
        </div>
      )}

      {tab === 'content' && (
        <Card>
          <CardContent className="pt-6">
            {content.data?.content.length ? (
              <div className="space-y-2">
                {content.data.content.map((c) => (
                  <button key={c._id} onClick={() => navigate(`/content/${c._id}`)} className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-secondary/50">
                    <span className="font-medium">{c.title}</span><StatusBadge status={c.status} />
                  </button>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No content for this project.</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'media' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.data?.media.map((m) => (
            <Card key={m._id} hover className="cursor-pointer overflow-hidden" onClick={() => navigate(`/media/${m._id}`)}>
              <div className="h-32 bg-muted">
                {m.fileType === 'image' && m.storageUrl && <img src={m.storageUrl} alt="" className="h-full w-full object-cover" />}
                {m.fileType === 'video' && <div className="flex h-full items-center justify-center bg-slate-900"><ImageIcon className="h-8 w-8 text-white/70" /></div>}
              </div>
              <div className="p-2"><StatusBadge status={m.status} /></div>
            </Card>
          ))}
          {!media.data?.media.length && <p className="col-span-full text-sm text-muted-foreground">No media yet.</p>}
        </div>
      )}

      {tab === 'approvals' && (
        <Card><CardContent className="pt-6 space-y-2">
          {approvals.data?.approvals.map((a) => (
            <div key={a._id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">{a.entityType} · {a.status}</span><StatusBadge status={a.status} />
            </div>
          ))}
          {!approvals.data?.approvals.length && <p className="text-sm text-muted-foreground">No approvals.</p>}
        </CardContent></Card>
      )}

      {tab === 'revisions' && (
        <Card><CardContent className="pt-6 space-y-2">
          {revisions.data?.revisions.map((r) => (
            <div key={r._id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{r.reason}</p>
              <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
            </div>
          ))}
          {!revisions.data?.revisions.length && <p className="text-sm text-muted-foreground">No revisions.</p>}
        </CardContent></Card>
      )}

      {tab === 'payments' && (
        <Card><CardContent className="pt-6 space-y-2">
          {payments.data?.payments.map((p) => (
            <div key={p._id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">{p.invoiceNumber}</span><StatusBadge status={p.paymentStatus} />
            </div>
          ))}
          {!payments.data?.payments.length && <p className="text-sm text-muted-foreground">No payments.</p>}
        </CardContent></Card>
      )}

      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="Publish Project"
        description="Confirm the project meets all preconditions before publishing."
        footer={<><Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button><Button onClick={onPublish} loading={publish.isPending}><Rocket className="h-4 w-4" /> Publish</Button></>}>
        <ul className="space-y-2 text-sm">
          <Precondition label="Client approval" ok={project.clientApproved} />
          <Precondition label="Admin approval" ok={project.adminApproved} />
          <Precondition label="Payment satisfied" ok={!project.paymentRequired || project.paymentSatisfied} />
          <Precondition label="Status" ok={project.status === 'READY_TO_PUBLISH' || project.status === 'ACTIVE'} />
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">The backend enforces these rules — publish will fail if any are unmet.</p>
      </Modal>

      <Modal open={revisionOpen} onClose={() => setRevisionOpen(false)} title="Request Revision"
        footer={<><Button variant="outline" onClick={() => setRevisionOpen(false)}>Cancel</Button><Button variant="destructive" onClick={onClientRevision} loading={clientRevision.isPending}>Submit</Button></>}>
        <Textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="Describe the changes you need..." rows={4} />
      </Modal>
    </div>
  )
}

function Precondition({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </li>
  )
}

function WorkflowStepper({ stages, state }: { stages: string[]; state: Record<string, boolean> }) {
  const labels: Record<string, string> = {
    CLIENT: 'Client', PROJECT: 'Project', TASKS: 'Tasks', CONTENT: 'Content',
    MEDIA: 'Media', CLIENT_REVIEW: 'Client Review', PAYMENT: 'Payment', PUBLISH: 'Publish',
  }
  return (
    <div className="flex items-center overflow-x-auto rounded-xl border border-border bg-card p-4 card-shadow">
      {stages.map((s, i) => {
        const done = state[s.toLowerCase()] ?? false
        return (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`whitespace-nowrap text-[11px] font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{labels[s]}</span>
            </div>
            {i < stages.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded-full ${done ? 'bg-success' : 'bg-muted'}`} />}
          </div>
        )
      })}
    </div>
  )
}
