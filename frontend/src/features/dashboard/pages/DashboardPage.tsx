import { useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { StatCard } from '../widgets/StatCard'
import { useAuth } from '@/features/auth'
import { useUIStore } from '@/stores/ui.store'
import { ROLE_LABELS } from '@/lib/permissions'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { images } from '@/assets/images'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { formatRelative } from '@/utils/formatDate'
import { useApprovals, useApprove, useRejectApproval, useRequestRevision } from '@/features/approvals/hooks/useApprovals'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { useProjects, usePublishProject } from '@/features/projects/hooks/useProjects'
import { useClients, useCreateClient, useClient } from '@/features/clients/hooks/useClients'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useClientApprove, useClientRevision } from '@/features/projects/hooks/useProjects'
import { useContent, useContentVersions, useUpdateContent, useSubmitContent, useCreateContent } from '@/features/content/hooks/useContent'
import { useMedia, useUploadMedia, useReplaceMedia } from '@/features/media/hooks/useMedia'
import { commentsApi } from '@/features/comments/api/comments.api'
import { useQueryClient } from '@tanstack/react-query'
import { Input, Select } from '@/components/ui/Field'
import { FormField } from '@/components/forms/FormField'
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FolderKanban,
  ListTodo,
  FileText,
  Image as ImageIcon,
  GitPullRequestArrow,
  CreditCard,
  AlertTriangle,
  Rocket,
  TrendingUp,
  FileCheck,
  Gavel,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { CommentsThread } from '@/features/comments/components/CommentsThread'

const HERO: Record<string, string> = {
  MARKETING: images.marketingTeam,
  ADMIN: images.adminSquad,
  CONTENT_TEAM: images.contentWriting,
  MEDIA_TEAM: images.videoEditing,
  CLIENT: images.dashboardClient,
  TASK_MANAGEMENT: images.dashboardAndClient,
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const role = user?.role ?? 'CLIENT'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ROLE_LABELS[role]} Dashboard`}
        description="Your workspace at a glance — live from the operations backend."
        image={HERO[role]}
      />

      {role === 'MARKETING' && <MarketingDashboard data={data} />}
      {role === 'ADMIN' && <AdminDashboard data={data} />}
      {role === 'TASK_MANAGEMENT' && <TaskManagementDashboard data={data} />}
      {role === 'CONTENT_TEAM' && <ContentDashboard data={data} />}
      {role === 'MEDIA_TEAM' && <MediaDashboard data={data} />}
      {role === 'CLIENT' && <ClientDashboard data={data} />}
    </div>
  )
}

function MarketingDashboard({ data }: { data: NonNullable<ReturnType<typeof useDashboard>['data']> }) {
  const { data: clientsData } = useClients({ limit: 200 })
  const { data: projectsData } = useProjects({ limit: 200 })
  const [stage, setStage] = useState<string>('')
  const [onboardOpen, setOnboardOpen] = useState(false)

  const clients = clientsData?.clients ?? []
  const projectByClient = Object.fromEntries((projectsData?.projects ?? []).map((p) => [p.clientId, p]))
  const projectMap = Object.fromEntries((projectsData?.projects ?? []).map((p) => [p._id, p]))

  const stages = [
    { key: '', label: 'All' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PENDING_ADMIN_APPROVAL', label: 'Pending Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ]
  const filtered = stage ? clients.filter((c) => c.status === stage) : clients

  const nextAction = (s: string) =>
    ({
      DRAFT: 'Complete onboarding',
      PENDING_ADMIN_APPROVAL: 'Awaiting admin approval',
      APPROVED: 'Kick off project',
      REJECTED: 'Revise & resubmit',
    })[s] ?? '—'

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Clients" value={data.totalClients ?? 0} icon={Users} tone="primary" />
          <StatCard title="Pending Approvals" value={data.pendingApprovals ?? 0} icon={Clock} tone="warning" />
          <StatCard title="Approved Clients" value={data.approvedClients ?? 0} icon={CheckCircle2} tone="success" />
          <StatCard title="Active Projects" value={data.activeProjects ?? 0} icon={FolderKanban} tone="accent" />
        </div>
        <Button onClick={() => setOnboardOpen(true)}>
          <Users className="h-4 w-4" /> Client Onboarding
        </Button>
      </div>

      {/* Pipeline drill-down + Submission list */}
      <Card>
        <CardHeader>
          <CardTitle>Client Submissions</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            {stages.map((s) => (
              <button
                key={s.key}
                onClick={() => setStage(s.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  stage === s.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {s.label}
                {s.key && (
                  <span className="ml-1 opacity-70">{clients.filter((c) => c.status === s.key).length}</span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Progress</th>
                    <th className="py-2 pr-4">Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const proj = projectByClient[c._id]
                    return (
                      <tr key={c._id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4 font-medium text-foreground">{c.companyName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{proj ? proj.name : '—'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{formatRelative(c.createdAt)}</td>
                        <td className="py-2 pr-4"><StatusBadge status={c.status} /></td>
                        <td className="py-2 pr-4">{proj ? <ProjectProgressStepper project={proj} compact /> : '—'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{nextAction(c.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No submissions in this stage.</p>
          )}
        </CardContent>
      </Card>

      {/* Project Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(projectsData?.projects ?? []).length ? (
            (projectsData?.projects ?? []).map((p) => (
              <div key={p._id} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-sm font-medium">{p.name}</p>
                <ProjectProgressStepper project={p} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
        </CardContent>
      </Card>

      {onboardOpen && <OnboardingModal onClose={() => setOnboardOpen(false)} />}
    </>
  )
}

function ProjectProgressStepper({
  project,
  compact,
}: {
  project: import('@/features/projects/api/projects.api').Project
  compact?: boolean
}) {
  const steps = [
    { label: 'Content', done: project.status !== 'DRAFT', active: project.status === 'ACTIVE' },
    { label: 'Media', done: project.status !== 'DRAFT', active: project.status === 'ACTIVE' },
    { label: 'Review', done: !!project.clientApproved, active: project.status === 'READY_TO_PUBLISH' && !project.adminApproved },
    { label: 'Approval', done: !!project.adminApproved, active: project.status === 'READY_TO_PUBLISH' && !!project.clientApproved },
    { label: 'Publishing', done: project.status === 'PUBLISHED', active: project.status === 'READY_TO_PUBLISH' },
  ]
  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              s.done
                ? 'bg-success/15 text-success'
                : s.active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="mx-1 text-muted-foreground">›</span>}
        </div>
      ))}
    </div>
  )
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const create = useCreateClient()
  const addToast = useUIStore((s) => s.addToast)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = {
      companyName: String(fd.get('companyName') || ''),
      clientName: String(fd.get('clientName') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || '') || undefined,
      productInformation: String(fd.get('productInformation') || '') || undefined,
      campaignInformation: String(fd.get('campaignInformation') || '') || undefined,
      requirements: String(fd.get('requirements') || '') || undefined,
      notes: String(fd.get('notes') || '') || undefined,
    }
    await create.mutateAsync(body)
    addToast({ type: 'success', title: 'Client onboarded', description: 'Draft created — continue onboarding to submit.' })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Client Onboarding" description="Capture client and campaign details to start a new engagement.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Company / Client Name" required>
          <Input name="companyName" required placeholder="Acme Corporation" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Primary Contact">
            <Input name="clientName" placeholder="Jane Doe" />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" name="email" required placeholder="contact@acme.com" />
          </FormField>
        </div>
        <FormField label="Phone">
          <Input name="phone" placeholder="+1 555 000 0000" />
        </FormField>
        <FormField label="Product / Service Information">
          <textarea name="productInformation" rows={2} className="flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="Campaign Requirements & Target Audience">
          <textarea name="requirements" rows={2} className="flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Target audience, goals, channels..." />
        </FormField>
        <FormField label="Content & Media Requirements">
          <textarea name="campaignInformation" rows={2} className="flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Deliverables, formats, deadlines..." />
        </FormField>
        <FormField label="Additional Notes">
          <textarea name="notes" rows={2} className="flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending}>Create Draft</Button>
        </div>
      </form>
    </Modal>
  )
}

function AdminDashboard({ data }: { data: NonNullable<ReturnType<typeof useDashboard>['data']> }) {
  const { data: approvalsData } = useApprovals({ status: 'PENDING', limit: 100 })
  const { data: paymentsData } = usePayments({ limit: 200 })
  const { data: projectsData } = useProjects({ limit: 200 })
  const { data: clientsData } = useClients({ limit: 200 })
  const { data: blockedTasks } = useTasks({ status: 'BLOCKED', limit: 50 })
  const { data: readyProjects } = useProjects({ status: 'READY_TO_PUBLISH', limit: 50 })
  const publish = usePublishProject()

  const projectMap = Object.fromEntries((projectsData?.projects ?? []).map((p) => [p._id, p.name]))
  const clientMap = Object.fromEntries((clientsData?.clients ?? []).map((c) => [c._id, c.companyName ?? c.email]))

  const approvals = (approvalsData?.approvals ?? []).map((a) => ({
    ...a,
    label:
      a.entityType === 'CLIENT'
        ? clientMap[a.entityId] ?? 'Client'
        : a.entityType === 'PROJECT'
          ? projectMap[a.entityId] ?? projectMap[a.projectId ?? ''] ?? 'Project'
          : projectMap[a.projectId ?? ''] ?? a.entityType,
  }))

  const categories: { key: string; label: string }[] = [
    { key: 'CLIENT', label: 'Client Approvals' },
    { key: 'CONTENT', label: 'Content Approvals' },
    { key: 'MEDIA', label: 'Media Approvals' },
    { key: 'PROJECT', label: 'Publishing Approvals' },
  ]

  const payments = paymentsData?.payments ?? []
  const paid = payments.filter((p) => p.paymentStatus === 'PAID')
  const pending = payments.filter((p) => p.paymentStatus === 'UNPAID' || p.paymentStatus === 'PARTIALLY_PAID')
  const overdue = payments.filter((p) => p.paymentStatus === 'OVERDUE')
  const upcoming = payments.filter((p) => p.dueDate && new Date(p.dueDate) >= new Date() && p.paymentStatus !== 'PAID')
  const sum = (arr: typeof payments) => arr.reduce((s, p) => s + (p.amount ?? 0), 0)
  const outstanding = [...pending, ...overdue].reduce((s, p) => s + (p.remainingAmount ?? p.amount - (p.paidAmount ?? 0)), 0)
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const now = Date.now()
  const overdueApprovals = approvals.filter((a) => new Date(a.createdAt).getTime() < now - 1000 * 60 * 60 * 48)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Clients" value={data.totalClients ?? 0} icon={Users} tone="primary" />
        <StatCard title="Active Projects" value={data.activeProjects ?? 0} icon={FolderKanban} tone="accent" />
        <StatCard title="Pending Tasks" value={data.pendingTasks ?? 0} icon={ListTodo} tone="warning" />
        <StatCard title="Ready to Publish" value={data.readyToPublish ?? 0} icon={Rocket} tone="success" />
      </div>

      {/* Pending Approvals - categorized */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4" /> Pending Approvals
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">{approvals.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {categories.map((cat) => {
            const items = approvals.filter((a) => a.entityType === cat.key)
            if (items.length === 0) return null
            return (
              <div key={cat.key}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                <div className="space-y-2">
                  {items.map((a) => (
                    <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.entityType} · Submitted {formatRelative(a.createdAt)}
                          {a.requestedBy ? ` · by ${String(a.requestedBy).slice(-6)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} />
                        <ApprovalReviewButton approval={a} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {approvals.length === 0 && <p className="text-sm text-muted-foreground">No pending approvals.</p>}
        </CardContent>
      </Card>

      {/* Payment Tracking */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Payment Tracking</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard title="Paid" value={fmt(sum(paid))} icon={CheckCircle2} tone="success" />
          <StatCard title="Pending" value={fmt(sum(pending))} icon={CreditCard} tone="primary" />
          <StatCard title="Overdue" value={fmt(sum(overdue))} icon={AlertTriangle} tone="danger" />
          <StatCard title="Upcoming" value={upcoming.length} icon={Clock} tone="warning" />
          <StatCard title="Outstanding" value={fmt(outstanding)} icon={TrendingUp} tone="accent" />
        </div>
      </div>

      {/* Escalation & Blockers */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Escalation & Blockers
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Blocked Tasks</p>
            <div className="space-y-2">
              {(blockedTasks?.tasks ?? []).length ? (
                (blockedTasks?.tasks ?? []).map((t) => (
                  <div key={t._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <p className="truncate text-sm">{t.title}</p>
                    {t.dueDate && <span className="text-xs text-muted-foreground">{formatRelative(t.dueDate)}</span>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No blocked tasks.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Overdue Approvals (&gt;48h)</p>
            <div className="space-y-2">
              {overdueApprovals.length ? (
                overdueApprovals.map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <p className="truncate text-sm">{a.label}</p>
                    <StatusBadge status={a.status} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No overdue approvals.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ready to Publish */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Ready to Publish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(readyProjects?.projects ?? []).length ? (
            (readyProjects?.projects ?? []).map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.clientApproved ? 'Client approved' : 'Awaiting client'}</p>
                </div>
                <PublishButton id={p._id} loading={publish.isPending} onPublish={() => publish.mutateAsync({ id: p._id })} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nothing ready to publish.</p>
          )}
        </CardContent>
      </Card>

      {data.activityTimeline && data.activityTimeline.length > 0 && (
        <ActivityTimeline items={data.activityTimeline} />
      )}
    </>
  )
}

function ApprovalReviewButton({ approval }: { approval: import('@/features/approvals/api/approvals.api').Approval & { label: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Review
      </Button>
      {open && <ApprovalReviewDrawer approval={approval} onClose={() => setOpen(false)} />}
    </>
  )
}

function ApprovalReviewDrawer({ approval, onClose }: { approval: import('@/features/approvals/api/approvals.api').Approval & { label: string }; onClose: () => void }) {
  const approve = useApprove()
  const reject = useRejectApproval()
  const revise = useRequestRevision()
  const [comment, setComment] = useState('')
  const addToast = useUIStore((s) => s.addToast)
  const act = async (fn: (a: { id: string; comment?: string }) => Promise<unknown>, label: string) => {
    try {
      await fn({ id: approval._id, comment })
      addToast({ type: 'success', title: label })
      onClose()
    } catch (err) {
      addToast({ type: 'error', title: label + ' failed', description: (err as Error).message })
    }
  }
  return (
    <Drawer
      open
      onClose={onClose}
      title={`Review: ${approval.label}`}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={approval.entityType} />
          <StatusBadge status={approval.status} />
        </div>
        <p className="text-sm text-muted-foreground">Submission type: {approval.entityType}</p>
        <FormFieldWrap label="Reviewer Comment">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Add a comment (optional for approve, required for reject)..."
          />
        </FormFieldWrap>
        <div className="flex flex-wrap gap-2">
          <Button loading={approve.isPending} onClick={() => act(approve.mutateAsync, 'Approved')}>Approve</Button>
          <Button variant="destructive" loading={reject.isPending} onClick={() => act(reject.mutateAsync, 'Rejected')}>Reject</Button>
          <Button variant="outline" loading={revise.isPending} onClick={() => act(revise.mutateAsync, 'Revision requested')}>
            Request Revision
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

function FormFieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

function PublishButton({ id, loading, onPublish }: { id: string; loading: boolean; onPublish: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} loading={loading}>
        Publish
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onPublish}
        title="Authorize publishing?"
        description="This will mark the project as published and notify stakeholders."
        confirmLabel="Publish"
      />
    </>
  )
}

function TaskManagementDashboard({ data }: { data: NonNullable<ReturnType<typeof useDashboard>['data']> }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tasks" value={data.totalTasks ?? 0} icon={ListTodo} tone="primary" />
        <StatCard title="Assigned Tasks" value={data.assignedTasks ?? 0} icon={TrendingUp} tone="accent" />
        <StatCard title="In Progress" value={data.inProgressTasks ?? 0} icon={Clock} tone="warning" />
        <StatCard title="Overdue" value={data.overdueTasks ?? 0} icon={AlertTriangle} tone="danger" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.teamWorkload?.length ? (
              data.teamWorkload.map((m, idx) => (
                <div key={String(m._id ?? idx)} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{m.name ?? (m._id ? String(m._id).slice(-6) : 'Unassigned')}</p>
                  <div className="text-xs text-muted-foreground">
                    {m.count !== undefined ? `${m.count} active` : `${m.pending ?? 0} pending · ${m.completed ?? 0} done`}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No workload data.</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <MiniStat label="Completed" value={data.completedTasks ?? 0} icon={CheckCircle2} />
            <MiniStat label="Team Size" value={data.teamSize ?? 0} icon={Users} />
            <MiniStat label="Overdue" value={data.overdueTasks ?? 0} icon={AlertTriangle} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function ContentDashboard({ data }: { data: NonNullable<ReturnType<typeof useDashboard>['data']> }) {
  const { user } = useAuth()
  const { data: contentData } = useContent({ limit: 100 })
  const { data: tasksData } = useTasks({ assignedTeam: 'CONTENT_TEAM', limit: 100 })
  const { data: projectsData } = useProjects({ limit: 100 })
  const [editorId, setEditorId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const contents = contentData?.content ?? []
  const tasks = tasksData?.tasks ?? []
  const projectMap = Object.fromEntries((projectsData?.projects ?? []).map((p) => [p._id, p.name]))
  const editorContent = contents.find((c) => c._id === editorId) ?? null

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Assigned Tasks" value={data.contentAssignedTasks ?? data.assignedTasks ?? 0} icon={ListTodo} tone="primary" />
        <StatCard title="Drafts" value={data.drafts ?? 0} icon={FileText} tone="neutral" />
        <StatCard title="Submitted" value={data.submittedContent ?? 0} icon={Clock} tone="warning" />
        <StatCard title="Revisions" value={data.revisionRequests ?? 0} icon={GitPullRequestArrow} tone="warning" />
        <StatCard title="Approved" value={data.approvedContent ?? 0} icon={CheckCircle2} tone="success" />
      </div>

      {/* My Tasks (linked to Task Manager) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> My Tasks
            <Link to="/tasks" className="ml-auto text-xs font-normal text-primary hover:underline">Open Task Manager</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Priority</th>
                    <th className="py-2 pr-4">Deadline</th>
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t._id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium">{t.title}</td>
                      <td className="py-2 pr-4"><StatusBadge status={t.priority} /></td>
                      <td className="py-2 pr-4 text-muted-foreground">{t.dueDate ? formatRelative(t.dueDate) : '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{typeof t.projectId === 'object' && t.projectId ? (t.projectId as { name: string }).name : projectMap[t.projectId as string] ?? '—'}</td>
                      <td className="py-2 pr-4"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks assigned.</p>
          )}
        </CardContent>
      </Card>

      {/* Content items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> My Content
            <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>New Content</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contents.length ? (
            contents.map((c) => (
              <div key={c._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    v{c.currentVersion} · {projectMap[c.projectId as string] ?? 'No project'}
                    {c.taskId ? ' · Linked to task' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <Button size="sm" variant="outline" onClick={() => setEditorId(c._id)}>Open Editor</Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No content yet.</p>
          )}
        </CardContent>
      </Card>

      {editorContent && <ContentEditorDrawer content={editorContent} projectName={projectMap[editorContent.projectId as string]} onClose={() => setEditorId(null)} />}
      {createOpen && (
        <CreateContentModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => setEditorId(id)}
        />
      )}
    </>
  )
}

function CreateContentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const create = useCreateContent()
  const { data: projects } = useProjects({ limit: 100 })
  const { data: tasks } = useTasks({ assignedTeam: 'CONTENT_TEAM', limit: 100 })
  const addToast = useUIStore((s) => s.addToast)
  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !title.trim()) {
      addToast({ type: 'error', title: 'Project and title are required' })
      return
    }
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        shortDescription: shortDescription.trim() || undefined,
        projectId,
        taskId: taskId || undefined,
      })
      addToast({ type: 'success', title: 'Content created' })
      onClose()
      onCreated(created._id)
    } catch (err) {
      addToast({ type: 'error', title: 'Could not create content', description: (err as Error).message })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Content" description="Create a new content item for a project.">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Project" required>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            <option value="">Select project</option>
            {(projects?.projects ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Linked Task (optional)">
          <Select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">None</option>
            {(tasks?.tasks ?? []).map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </Select>
        </FormField>
        <FormField label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Summer Campaign Hero Copy" />
        </FormField>
        <FormField label="Short Description">
          <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={3} className={ta} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

function ContentEditorDrawer({
  content,
  projectName,
  onClose,
}: {
  content: import('@/features/content/api/content.api').Content
  projectName?: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const update = useUpdateContent(content._id)
  const submit = useSubmitContent()
  const { data: versionsData } = useContentVersions(content._id)
  const [form, setForm] = useState({
    title: content.title,
    shortDescription: content.shortDescription ?? '',
    longDescription: content.longDescription ?? '',
    captions: (content.captions ?? []).join(', '),
    cta: content.cta ?? '',
    hashtags: (content.hashtags ?? []).join(', '),
    metaTitle: content.seoFields?.metaTitle ?? '',
    metaDescription: content.seoFields?.metaDescription ?? '',
    keywords: (content.seoFields?.keywords ?? []).join(', '),
    slug: content.seoFields?.slug ?? '',
    notes: content.notes ?? '',
  })
  const [clarifyOpen, setClarifyOpen] = useState(false)
  const [clarifyMsg, setClarifyMsg] = useState('')
  const [compareVersion, setCompareVersion] = useState<number | null>(null)
  const addToast = useUIStore((s) => s.addToast)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const saveDraft = async () => {
    try {
      await update.mutateAsync({
        title: form.title,
        shortDescription: form.shortDescription,
        longDescription: form.longDescription,
        captions: form.captions.split(',').map((s) => s.trim()).filter(Boolean),
        cta: form.cta,
        hashtags: form.hashtags.split(',').map((s) => s.trim()).filter(Boolean),
        seoFields: { metaTitle: form.metaTitle, metaDescription: form.metaDescription, keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean), slug: form.slug },
        notes: form.notes,
      })
      addToast({ type: 'success', title: 'Draft saved' })
    } catch (err) {
      addToast({ type: 'error', title: 'Could not save draft', description: (err as Error).message })
    }
  }
  const submitReview = async () => {
    try {
      await submit.mutateAsync({ id: content._id, changes: `Submitted v${(content.currentVersion + 1)}` })
      addToast({ type: 'success', title: 'Submitted for review' })
      onClose()
    } catch (err) {
      addToast({ type: 'error', title: 'Could not submit', description: (err as Error).message })
    }
  }
  const sendClarification = async () => {
    if (!clarifyMsg.trim()) return
    await commentsApi.create({ entityType: 'CONTENT', entityId: content._id, projectId: content.projectId, message: `[Clarification] ${clarifyMsg}` })
    qc.invalidateQueries({ queryKey: ['comments'] })
    addToast({ type: 'success', title: 'Clarification sent' })
    setClarifyOpen(false)
    setClarifyMsg('')
  }

  const versions = versionsData ?? content.versions ?? []
  const compareSnap = versions.find((v) => v.versionNumber === compareVersion)?.snapshot as Record<string, unknown> | undefined

  return (
    <Drawer
      open
      onClose={onClose}
      title={content.title}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={content.status} />
          {projectName && <span className="text-xs text-muted-foreground">Project: {projectName}</span>}
          {content.taskId && <span className="text-xs text-muted-foreground">· Linked to Task Manager task</span>}
        </div>

        <FormField label="Title"><Input value={form.title} onChange={set('title')} /></FormField>
        <FormField label="Short Description"><textarea value={form.shortDescription} onChange={set('shortDescription')} rows={2} className={ta} /></FormField>
        <FormField label="Body / Long Description"><textarea value={form.longDescription} onChange={set('longDescription')} rows={5} className={ta} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Captions (comma separated)"><Input value={form.captions} onChange={set('captions')} /></FormField>
          <FormField label="CTA"><Input value={form.cta} onChange={set('cta')} /></FormField>
        </div>
        <FormField label="Hashtags / Categories (comma separated)"><Input value={form.hashtags} onChange={set('hashtags')} /></FormField>
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold">SEO Fields</p>
          <div className="space-y-3">
            <FormField label="Meta Title"><Input value={form.metaTitle} onChange={set('metaTitle')} /></FormField>
            <FormField label="Meta Description"><textarea value={form.metaDescription} onChange={set('metaDescription')} rows={2} className={ta} /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Keywords (comma separated)"><Input value={form.keywords} onChange={set('keywords')} /></FormField>
              <FormField label="Slug"><Input value={form.slug} onChange={set('slug')} /></FormField>
            </div>
          </div>
        </div>
        <FormField label="Notes"><textarea value={form.notes} onChange={set('notes')} rows={2} className={ta} /></FormField>

        <div className="flex flex-wrap gap-2">
          <Button loading={update.isPending} onClick={saveDraft}>Save Draft</Button>
          <Button loading={submit.isPending} onClick={submitReview}>Submit for Review</Button>
          <Button variant="outline" onClick={() => setClarifyOpen(true)}>Request Clarification</Button>
        </div>

        {/* Version History */}
        <div>
          <p className="mb-2 text-sm font-semibold">Version History</p>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.versionNumber} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                <div>
                  <span className="font-medium">v{v.versionNumber}</span>
                  <span className="ml-2 text-muted-foreground">{formatRelative(v.createdAt)}</span>
                  {v.changes && <span className="ml-2 text-xs text-muted-foreground">— {v.changes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.approvalStatus} />
                  <Button size="sm" variant="outline" onClick={() => setCompareVersion(v.versionNumber)}>Compare</Button>
                </div>
              </div>
            ))}
            {versions.length === 0 && <p className="text-sm text-muted-foreground">No versions yet.</p>}
          </div>
        </div>

        {/* Client feedback */}
        <div>
          <p className="mb-2 text-sm font-semibold">Client Feedback & Revision Requests</p>
          <CommentsThread entityType="CONTENT" entityId={content._id} projectId={content.projectId} />
        </div>
      </div>

      <Modal
        open={clarifyOpen}
        onClose={() => setClarifyOpen(false)}
        title="Request clarification"
        footer={
          <>
            <Button variant="outline" onClick={() => setClarifyOpen(false)}>Cancel</Button>
            <Button onClick={sendClarification} disabled={!clarifyMsg.trim()}>Send</Button>
          </>
        }
      >
        <textarea value={clarifyMsg} onChange={(e) => setClarifyMsg(e.target.value)} rows={3} className={ta} placeholder="What do you need clarified?" />
      </Modal>

      <Modal
        open={compareVersion !== null}
        onClose={() => setCompareVersion(null)}
        title={`Compare v${compareVersion} with current`}
        footer={<Button variant="outline" onClick={() => setCompareVersion(null)}>Close</Button>}
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="mb-1 font-semibold">v{compareVersion}</p>
            <p className="text-muted-foreground">{(compareSnap?.title as string) ?? '—'}</p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{(compareSnap?.longDescription as string) ?? '—'}</p>
          </div>
          <div>
            <p className="mb-1 font-semibold">Current</p>
            <p className="text-muted-foreground">{form.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{form.longDescription}</p>
          </div>
        </div>
      </Modal>
    </Drawer>
  )
}

const ta = 'flex min-h-[60px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function MediaDashboard({ data }: { data: NonNullable<ReturnType<typeof useDashboard>['data']> }) {
  const { data: mediaData } = useMedia({ limit: 100 })
  const { data: tasksData } = useTasks({ assignedTeam: 'MEDIA_TEAM', limit: 100 })
  const { data: projectsData } = useProjects({ limit: 100 })
  const [detailId, setDetailId] = useState<string | null>(null)
  const media = mediaData?.media ?? []
  const tasks = tasksData?.tasks ?? []
  const projectMap = Object.fromEntries((projectsData?.projects ?? []).map((p) => [p._id, p.name]))
  const detail = media.find((m) => m._id === detailId) ?? null

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Assigned Tasks" value={data.assignedMediaTasks ?? 0} icon={ImageIcon} tone="primary" />
        <StatCard title="Upload Queue" value={data.uploadQueue ?? 0} icon={TrendingUp} tone="accent" />
        <StatCard title="Processing" value={data.processingFiles ?? 0} icon={Clock} tone="warning" />
        <StatCard title="Review Pending" value={data.reviewPending ?? 0} icon={FileCheck} tone="purple" />
        <StatCard title="Approved" value={data.approvedMedia ?? 0} icon={CheckCircle2} tone="success" />
      </div>

      {/* My Tasks linked to Task Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> My Tasks
            <Link to="/tasks" className="ml-auto text-xs font-normal text-primary hover:underline">Open Task Manager</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Priority</th>
                    <th className="py-2 pr-4">Deadline</th>
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t._id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium">{t.title}</td>
                      <td className="py-2 pr-4"><StatusBadge status={t.priority} /></td>
                      <td className="py-2 pr-4 text-muted-foreground">{t.dueDate ? formatRelative(t.dueDate) : '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{typeof t.projectId === 'object' && t.projectId ? (t.projectId as { name: string }).name : projectMap[t.projectId as string] ?? '—'}</td>
                      <td className="py-2 pr-4"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks assigned.</p>
          )}
        </CardContent>
      </Card>

      {/* Media grid */}
      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {media.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((m) => (
                <button key={m._id} onClick={() => setDetailId(m._id)} className="rounded-lg border border-border p-3 text-left hover:bg-secondary/50">
                  <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded bg-secondary">
                    {m.thumbnail ? (
                      <img src={m.thumbnail} alt={m.fileName} className="h-full w-full object-cover" />
                    ) : m.fileType === 'video' ? (
                      <span className="text-xs text-muted-foreground">Video</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{m.fileType}</span>
                    )}
                  </div>
                  <p className="truncate text-sm font-medium">{m.fileName}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">v{m.version}</span>
                    <StatusBadge status={m.status} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No media yet.</p>
          )}
        </CardContent>
      </Card>

      {detail && <MediaDetailDrawer media={detail} projectName={projectMap[detail.projectId as string]} onClose={() => setDetailId(null)} />}
    </>
  )
}

function MediaUploadModal({
  onClose,
  projects,
  tasks,
}: {
  onClose: () => void
  projects: Array<{ _id: string; name: string }>
  tasks: Array<{ _id: string; title: string }>
}) {
  const upload = useUploadMedia()
  const addToast = useUIStore((s) => s.addToast)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ projectId: '', taskId: '', fileType: 'image', resolution: '', duration: '', description: '', tags: '' })

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !form.projectId) {
      addToast({ type: 'error', title: 'Project and file required' })
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('projectId', form.projectId)
    if (form.taskId) fd.append('taskId', form.taskId)
    if (form.resolution) fd.append('resolution', form.resolution)
    if (form.duration) fd.append('duration', form.duration)
    fd.append('metadata', JSON.stringify({ description: form.description, tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean) }))
    try {
      await upload.mutateAsync(fd)
      addToast({ type: 'success', title: 'Media uploaded', description: 'Processing pipeline started.' })
      onClose()
    } catch (err) {
      addToast({ type: 'error', title: 'Could not upload media', description: (err as Error).message })
    }
  }

  return (
    <Modal open onClose={onClose} title="Upload Media" description="Upload a video, image or document asset.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="File" required>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Project" required>
            <Select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Linked Task">
            <Select value={form.taskId} onChange={(e) => setForm((f) => ({ ...f, taskId: e.target.value }))}>
              <option value="">None</option>
              {tasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Type">
            <Select value={form.fileType} onChange={(e) => setForm((f) => ({ ...f, fileType: e.target.value }))}>
              {(['image', 'video', 'document'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Resolution"><Input value={form.resolution} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))} placeholder="1920x1080" /></FormField>
          <FormField label="Duration"><Input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="00:01:30" /></FormField>
        </div>
        <FormField label="Description"><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className={ta} /></FormField>
        <FormField label="Tags (comma separated)"><Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={upload.isPending}>Upload</Button>
        </div>
      </form>
    </Modal>
  )
}

function MediaDetailDrawer({
  media,
  projectName,
  onClose,
}: {
  media: import('@/features/media/api/media.api').Media
  projectName?: string
  onClose: () => void
}) {
  const replace = useReplaceMedia(media._id)
  const addToast = useUIStore((s) => s.addToast)
  const [file, setFile] = useState<File | null>(null)
  const [previewVersion, setPreviewVersion] = useState<number | null>(null)
  const meta = (media.metadata ?? {}) as { description?: string; tags?: string[] }

  const uploadRevised = async () => {
    if (!file) {
      addToast({ type: 'error', title: 'Select a file' })
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    try {
      await replace.mutateAsync(fd)
      addToast({ type: 'success', title: 'Revised version uploaded' })
      setFile(null)
    } catch (err) {
      addToast({ type: 'error', title: 'Could not upload revision', description: (err as Error).message })
    }
  }

  const versions = media.versions ?? []
  const preview = versions.find((v) => v.version === previewVersion)

  return (
    <Drawer
      open
      onClose={onClose}
      title={media.fileName}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={media.status} />
          {projectName && <span className="text-xs text-muted-foreground">Project: {projectName}</span>}
          {media.taskId && <span className="text-xs text-muted-foreground">· Linked to task</span>}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border p-3 text-sm">
          <Meta label="File Type" value={media.fileType} />
          <Meta label="Format" value={media.mimeType ?? '—'} />
          <Meta label="Resolution" value={media.resolution ?? '—'} />
          <Meta label="Duration" value={media.duration != null ? String(media.duration) : '—'} />
          <Meta label="Size" value={media.fileSize ? `${(media.fileSize / 1024).toFixed(1)} KB` : '—'} />
          <Meta label="Version" value={`v${media.version}`} />
          {meta.description && <Meta label="Description" value={meta.description} />}
          {meta.tags?.length ? <Meta label="Tags" value={meta.tags.join(', ')} /> : null}
        </div>

        {/* Preview */}
        {media.storageUrl && (
          <div className="overflow-hidden rounded-lg border border-border">
            {media.fileType === 'video' ? (
              <video src={media.storageUrl} controls className="max-h-64 w-full" />
            ) : media.fileType === 'image' ? (
              <img src={media.storageUrl} alt={media.fileName} className="max-h-64 w-full object-contain" />
            ) : (
              <a href={media.storageUrl} className="block p-3 text-sm text-primary hover:underline">Open file</a>
            )}
          </div>
        )}

        {/* Version Control */}
        <div>
          <p className="mb-2 text-sm font-semibold">Version Control</p>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.version} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                <div>
                  <span className="font-medium">v{v.version}</span>
                  <span className="ml-2 text-muted-foreground">{formatRelative(v.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.approvalStatus ?? 'PENDING'} />
                  <Button size="sm" variant="outline" onClick={() => setPreviewVersion(v.version)}>Preview</Button>
                </div>
              </div>
            ))}
            {versions.length === 0 && <p className="text-sm text-muted-foreground">No versions yet.</p>}
          </div>
        </div>

        {/* Upload revised version */}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold">Upload Revised Version</p>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          <Button className="mt-2" size="sm" loading={replace.isPending} onClick={uploadRevised}>Upload Revision</Button>
        </div>

        {/* Feedback */}
        <div>
          <p className="mb-2 text-sm font-semibold">Reviewer / Client Feedback</p>
          <CommentsThread entityType="MEDIA" entityId={media._id} projectId={media.projectId} />
        </div>
      </div>

      <Modal
        open={previewVersion !== null}
        onClose={() => setPreviewVersion(null)}
        title={`Preview v${previewVersion}`}
        footer={<Button variant="outline" onClick={() => setPreviewVersion(null)}>Close</Button>}
      >
        {preview?.storageUrl ? (
          (preview.mimeType ?? '').startsWith('video') ? (
            <video src={preview.storageUrl} controls className="max-h-72 w-full" />
          ) : (
            <img src={preview.storageUrl} alt={preview.fileName} className="max-h-72 w-full object-contain" />
          )
        ) : (
          <p className="text-sm text-muted-foreground">No preview available.</p>
        )}
      </Modal>
    </Drawer>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-foreground">{value}</span>
    </div>
  )
}

function ClientDashboard({ data }: { data: NonNullable<ReturnType<typeof useDashboard>['data']> }) {
  const { data: projectsData } = useProjects({ limit: 20 })
  const projects = projectsData?.projects ?? []
  const [selectedId, setSelectedId] = useState(projects[0]?._id ?? '')
  const project = projects.find((p) => p._id === selectedId) ?? projects[0]
  const { data: clientData } = useClient(project?.clientId ?? '')
  const { data: contentData } = useContent({ projectId: project?._id, limit: 50 })
  const { data: mediaData } = useMedia({ projectId: project?._id, limit: 50 })
  const { data: paymentsData } = usePayments({ clientId: project?.clientId, limit: 50 })
  const approve = useClientApprove()
  const revision = useClientRevision()
  const [reviseOpen, setReviseOpen] = useState(false)
  const [reason, setReason] = useState('')
  const addToast = useUIStore((s) => s.addToast)

  const contents = contentData?.content ?? []
  const medias = mediaData?.media ?? []
  const payments = paymentsData?.payments ?? []

  const canReview = project && !project.clientApproved && project.status !== 'PUBLISHED'

  const submitRevision = async () => {
    if (!reason.trim() || !project) return
    await revision.mutateAsync({ id: project._id, note: reason })
    addToast({ type: 'success', title: 'Revision requested' })
    setReviseOpen(false)
    setReason('')
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Projects" value={data.activeProjects ?? 0} icon={FolderKanban} tone="primary" />
        <StatCard title="Pending Approvals" value={data.pendingApprovals ?? 0} icon={Clock} tone="warning" />
        <StatCard title="Revision Requests" value={data.revisionRequests ?? 0} icon={GitPullRequestArrow} tone="warning" />
        <StatCard title="Approved Content" value={data.approvedContent ?? 0} icon={CheckCircle2} tone="success" />
      </div>

      {projects.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p._id}
              onClick={() => setSelectedId(p._id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                p._id === (project?._id) ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {project ? (
        <>
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{project.name}</span>
                <StatusBadge status={project.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {project.clientApproved ? 'You approved this deliverable.' : 'Awaiting your review.'}
              </p>
              {canReview && (
                <div className="ml-auto flex gap-2">
                  <Button loading={approve.isPending} onClick={() => approve.mutateAsync(project._id)}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => setReviseOpen(true)}>
                    <XCircle className="h-4 w-4" /> Request Revision
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consolidated Project Package */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Package</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Company" value={clientData?.companyName ?? '—'} />
                <DetailRow label="Product Information" value={clientData?.productInformation ?? '—'} />
                <DetailRow label="Campaign Information" value={clientData?.campaignInformation ?? '—'} />
                <DetailRow label="Status" value={project.status} />
                <DetailRow label="Client Approved" value={project.clientApproved ? 'Yes' : 'No'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deliverables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Content ({contents.length})</p>
                  <div className="space-y-2">
                    {contents.map((c: { _id: string; title: string; status: string }) => (
                      <div key={c._id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{c.title}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="mt-2">
                          <CommentsThread entityType="CONTENT" entityId={c._id} projectId={project._id} />
                        </div>
                      </div>
                    ))}
                    {contents.length === 0 && <p className="text-sm text-muted-foreground">No content yet.</p>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Media ({medias.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {medias.map((m: { _id: string; fileName?: string; url?: string; status: string; fileType?: string }) => (
                      <div key={m._id} className="rounded-lg border border-border p-3">
                        {m.url && (m.fileType?.startsWith('image') || !m.fileType) ? (
                          <img src={m.url} alt={m.fileName ?? 'media'} className="mb-2 h-24 w-full rounded object-cover" />
                        ) : (
                          <div className="mb-2 flex h-24 items-center justify-center rounded bg-secondary text-xs text-muted-foreground">
                            {m.fileType ?? 'Media'}
                          </div>
                        )}
                        <p className="truncate text-sm font-medium">{m.fileName ?? m._id}</p>
                        <StatusBadge status={m.status} />
                        <div className="mt-2">
                          <CommentsThread entityType="MEDIA" entityId={m._id} projectId={project._id} />
                        </div>
                      </div>
                    ))}
                    {medias.length === 0 && <p className="text-sm text-muted-foreground">No media yet.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payments & Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="py-2 pr-4">Invoice</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Due</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4 font-medium">{p.invoiceNumber}</td>
                          <td className="py-2 pr-4">${p.amount?.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{p.dueDate ? formatRelative(p.dueDate) : '—'}</td>
                          <td className="py-2 pr-4"><StatusBadge status={p.paymentStatus} /></td>
                          <td className="py-2 pr-4">${(p.remainingAmount ?? p.amount - (p.paidAmount ?? 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No invoices.</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(data.recentActivity ?? []).length ? (
                <ActivityList items={data.recentActivity!} />
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </CardContent>
          </Card>

          <Modal
            open={reviseOpen}
            onClose={() => setReviseOpen(false)}
            title="Request revision"
            description="Provide a reason for the revision (required)."
            footer={
              <>
                <Button variant="outline" onClick={() => setReviseOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={submitRevision} loading={revision.isPending} disabled={!reason.trim()}>
                  Send Request
                </Button>
              </>
            }
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe the changes needed..."
            />
          </Modal>
        </>
      ) : (
        <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="No projects yet" description="Your onboarded projects will appear here." />
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-border pb-2 last:border-0">
      <span className="w-40 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground">{value || '—'}</span>
    </div>
  )
}

function PipelineRow({ label, value, tone }: { label: string; value: number; tone: 'success' | 'danger' | 'warning' }) {
  const color = { success: 'text-emerald-600', danger: 'text-rose-600', warning: 'text-amber-600' }[tone]
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-lg border border-border p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function ActivityTimeline({ items }: { items: Array<{ _id: string; description?: string; action?: string; createdAt: string; role?: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l border-border pl-5">
          {items.map((a) => (
            <li key={a._id} className="relative">
              <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-primary/70 ring-4 ring-card" />
              <p className="text-sm text-foreground">{a.description ?? a.action}</p>
              <p className="text-xs text-muted-foreground">
                {a.role ? `${a.role} · ` : ''}
                {formatRelative(a.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

function ActivityList({ items }: { items: Array<{ _id: string; description?: string; action?: string; createdAt: string }> }) {
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a._id} className="border-b border-border pb-3 last:border-0">
          <p className="text-sm text-foreground">{a.description ?? a.action}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}
