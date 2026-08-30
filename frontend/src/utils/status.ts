export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'accent'

export interface StatusStyle {
  label: string
  tone: StatusTone
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  accent: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
}

export function statusClasses(tone: StatusTone): string {
  return TONE_CLASSES[tone]
}

export function statusStyle(value?: string): StatusStyle {
  switch (value) {
    case 'DRAFT':
      return { label: 'Draft', tone: 'neutral' }
    case 'PENDING':
    case 'PENDING_ADMIN_APPROVAL':
      return { label: 'Pending', tone: 'warning' }
    case 'IN_PROGRESS':
    case 'PROCESSING':
    case 'UPLOADING':
      return { label: 'In Progress', tone: 'info' }
    case 'UNDER_REVIEW':
    case 'IN_REVIEW':
    case 'READY_FOR_REVIEW':
      return { label: 'Under Review', tone: 'purple' }
    case 'REVISION_REQUIRED':
      return { label: 'Revision Required', tone: 'warning' }
    case 'RESUBMITTED':
      return { label: 'Resubmitted', tone: 'accent' }
    case 'APPROVED':
    case 'PUBLISHED':
      return { label: 'Approved', tone: 'success' }
    case 'REJECTED':
      return { label: 'Rejected', tone: 'danger' }
    case 'BLOCKED':
    case 'FAILED':
      return { label: 'Blocked', tone: 'danger' }
    case 'COMPLETED':
      return { label: 'Completed', tone: 'success' }
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'neutral' }
    case 'OVERDUE':
    case 'UNPAID':
      return { label: 'Overdue', tone: 'danger' }
    case 'PARTIALLY_PAID':
      return { label: 'Partially Paid', tone: 'warning' }
    case 'PAID':
      return { label: 'Paid', tone: 'success' }
    case 'ACTIVE':
      return { label: 'Active', tone: 'success' }
    case 'INACTIVE':
      return { label: 'Inactive', tone: 'neutral' }
    case 'SUSPENDED':
    case 'LOCKED':
      return { label: 'Suspended', tone: 'danger' }
    case 'OPEN':
      return { label: 'Open', tone: 'warning' }
    case 'CLOSED':
    case 'RESOLVED':
      return { label: 'Resolved', tone: 'success' }
    case 'TODO':
      return { label: 'To Do', tone: 'neutral' }
    case 'LOW':
      return { label: 'Low', tone: 'neutral' }
    case 'MEDIUM':
      return { label: 'Medium', tone: 'info' }
    case 'HIGH':
      return { label: 'High', tone: 'warning' }
    case 'URGENT':
      return { label: 'Urgent', tone: 'danger' }
    default:
      return { label: value ?? 'Unknown', tone: 'neutral' }
  }
}
