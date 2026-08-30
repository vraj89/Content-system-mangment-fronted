import { cn } from '@/utils/cn'
import { statusClasses, type StatusTone } from '@/utils/status'

export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: React.ReactNode
  className?: string
  tone?: StatusTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        statusClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const { label, tone } = (() => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draft', tone: 'neutral' as StatusTone }
      case 'PENDING':
      case 'PENDING_ADMIN_APPROVAL':
        return { label: 'Pending Approval', tone: 'warning' as StatusTone }
      case 'IN_PROGRESS':
      case 'PROCESSING':
      case 'UPLOADING':
        return { label: 'In Progress', tone: 'info' as StatusTone }
      case 'UNDER_REVIEW':
      case 'IN_REVIEW':
      case 'READY_FOR_REVIEW':
        return { label: 'Under Review', tone: 'purple' as StatusTone }
      case 'REVISION_REQUIRED':
        return { label: 'Revision Required', tone: 'warning' as StatusTone }
      case 'RESUBMITTED':
        return { label: 'Resubmitted', tone: 'accent' as StatusTone }
      case 'APPROVED':
      case 'PUBLISHED':
        return { label: 'Approved', tone: 'success' as StatusTone }
      case 'REJECTED':
        return { label: 'Rejected', tone: 'danger' as StatusTone }
      case 'BLOCKED':
      case 'FAILED':
        return { label: 'Blocked', tone: 'danger' as StatusTone }
      case 'COMPLETED':
        return { label: 'Completed', tone: 'success' as StatusTone }
      case 'CANCELLED':
        return { label: 'Cancelled', tone: 'neutral' as StatusTone }
      case 'OVERDUE':
      case 'UNPAID':
        return { label: 'Overdue', tone: 'danger' as StatusTone }
      case 'PARTIALLY_PAID':
        return { label: 'Partially Paid', tone: 'warning' as StatusTone }
      case 'PAID':
        return { label: 'Paid', tone: 'success' as StatusTone }
      case 'ACTIVE':
        return { label: 'Active', tone: 'success' as StatusTone }
      case 'INACTIVE':
        return { label: 'Inactive', tone: 'neutral' as StatusTone }
      case 'SUSPENDED':
      case 'LOCKED':
        return { label: 'Suspended', tone: 'danger' as StatusTone }
      case 'OPEN':
        return { label: 'Open', tone: 'warning' as StatusTone }
      case 'CLOSED':
      case 'RESOLVED':
        return { label: 'Resolved', tone: 'success' as StatusTone }
      case 'TODO':
        return { label: 'To Do', tone: 'neutral' as StatusTone }
      case 'LOW':
        return { label: 'Low', tone: 'neutral' as StatusTone }
      case 'MEDIUM':
        return { label: 'Medium', tone: 'info' as StatusTone }
      case 'HIGH':
        return { label: 'High', tone: 'warning' as StatusTone }
      case 'URGENT':
        return { label: 'Urgent', tone: 'danger' as StatusTone }
      default:
        return { label: status ?? 'Unknown', tone: 'neutral' as StatusTone }
    }
  })()

  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  )
}
