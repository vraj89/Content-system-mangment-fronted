import type { Role, Permission, User } from '@/types/permissions'
import { hasPermission } from '@/lib/permissions'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderKanban,
  Package,
  ListTodo,
  FileText,
  Image as ImageIcon,
  CheckCheck,
  GitPullRequestArrow,
  CreditCard,
  UserCog,
  ScrollText,
  Bell,
  Target,
  BarChart3,
  KanbanSquare,
  CalendarDays,
  Users2,
  AlertTriangle,
  Rocket,
  ClipboardList,
  Upload,
  Megaphone,
  TrendingUp,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  permission?: Permission
  exact?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export function getNavigation(user: User | null): NavSection[] {
  if (!user) return []
  const { role } = user
  const is = (r: Role) => role === r

  switch (role) {
    case 'ADMIN':
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Main',
          items: [
            { label: 'Projects', path: '/projects', icon: FolderKanban },
            { label: 'Clients', path: '/clients', icon: Users },
            { label: 'Users', path: '/users', icon: UserCog },
          ],
        },
        {
          title: 'Approvals',
          items: [
            { label: 'Pending Approvals', path: '/approvals', icon: CheckCheck },
            { label: 'Revisions', path: '/revisions', icon: GitPullRequestArrow },
            { label: 'Ready to Publish', path: '/ready-to-publish', icon: Rocket },
          ],
        },
        {
          title: 'Monitoring',
          items: [
            { label: 'Escalations', path: '/escalations', icon: AlertTriangle },
            { label: 'Overdue & Blocked', path: '/overdue', icon: AlertTriangle },
          ],
        },
        {
          title: 'Finance',
          items: [{ label: 'Payments', path: '/payments', icon: CreditCard }],
        },
        {
          title: 'Reports',
          items: [
            { label: 'Project Reports', path: '/reports/projects', icon: BarChart3 },
            { label: 'Team Performance', path: '/reports/team', icon: Users2 },
          ],
        },
        {
          title: 'System',
          items: [
            { label: 'Audit Trail', path: '/audit-logs', icon: ScrollText },
            { label: 'Notifications', path: '/notifications', icon: Bell },
          ],
        },
      ]

    case 'MARKETING':
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Main',
          items: [
            { label: 'Leads', path: '/leads', icon: Target },
            { label: 'Clients', path: '/clients', icon: Users },
            { label: 'Projects', path: '/projects', icon: FolderKanban },
          ],
        },
        {
          title: 'Client Management',
          items: [
            { label: 'Add Client', path: '/clients/new', icon: UserPlus },
          ],
        },
        {
          title: 'Pipeline',
          items: [
            { label: 'Pipeline', path: '/pipeline', icon: TrendingUp },
            { label: 'Submissions', path: '/clients?status=PENDING_ADMIN_APPROVAL', icon: ClipboardList },
          ],
        },
        {
          title: 'Communication',
          items: [
            { label: 'Notifications', path: '/notifications', icon: Bell },
          ],
        },
        {
          title: 'Reports',
          items: [{ label: 'Client Reports', path: '/reports/clients', icon: BarChart3 }],
        },
      ]

    case 'TASK_MANAGEMENT':
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Main',
          items: [
            { label: 'All Tasks', path: '/tasks', icon: ListTodo },
            { label: 'My Tasks', path: '/tasks?assignee=me', icon: ClipboardList },
            { label: 'Create Task', path: '/tasks/new', icon: ListTodo },
            { label: 'Kanban Board', path: '/kanban', icon: KanbanSquare },
            { label: 'Calendar', path: '/calendar', icon: CalendarDays },
          ],
        },
        {
          title: 'Monitoring',
          items: [
            { label: 'Overdue Tasks', path: '/overdue-tasks', icon: AlertTriangle },
            { label: 'Blocked Tasks', path: '/tasks?status=BLOCKED', icon: AlertTriangle },
          ],
        },
        {
          title: 'Teams',
          items: [
            { label: 'Team Workload', path: '/team-workload', icon: Users2 },
            { label: 'Content Tasks', path: '/tasks?team=CONTENT_TEAM', icon: FileText },
            { label: 'Media Tasks', path: '/tasks?team=MEDIA_TEAM', icon: ImageIcon },
          ],
        },
        {
          title: 'Projects',
          items: [{ label: 'Active Projects', path: '/projects', icon: FolderKanban }],
        },
        {
          title: 'Communication',
          items: [
            { label: 'Notifications', path: '/notifications', icon: Bell },
          ],
        },
      ]

    case 'CONTENT_TEAM':
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Main',
          items: [
            { label: 'My Tasks', path: '/tasks?team=CONTENT_TEAM', icon: ListTodo },
            { label: 'My Content', path: '/content', icon: FileText },
          ],
        },
        {
          title: 'Workflow',
          items: [
            { label: 'Drafts', path: '/content?status=DRAFT', icon: FileText },
            { label: 'Submitted', path: '/content?status=SUBMITTED', icon: FileText },
            { label: 'Revisions', path: '/revisions', icon: GitPullRequestArrow },
            { label: 'Approved', path: '/content?status=APPROVED', icon: FileText },
          ],
        },
        {
          title: 'Content',
          items: [
            { label: 'Version History', path: '/content', icon: ClipboardList },
            { label: 'Approvals', path: '/approvals', icon: CheckCheck },
          ],
        },
        {
          title: 'Communication',
          items: [{ label: 'Notifications', path: '/notifications', icon: Bell }],
        },
      ]

    case 'MEDIA_TEAM':
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Main',
          items: [
            { label: 'My Tasks', path: '/tasks?team=MEDIA_TEAM', icon: ListTodo },
            { label: 'Media Library', path: '/media', icon: ImageIcon },
          ],
        },
        {
          title: 'Workflow',
          items: [
            { label: 'Processing', path: '/media?status=PROCESSING', icon: ImageIcon },
            { label: 'Under Review', path: '/media?status=READY_FOR_REVIEW', icon: ImageIcon },
            { label: 'Revisions', path: '/revisions', icon: GitPullRequestArrow },
            { label: 'Approved', path: '/media?status=APPROVED', icon: ImageIcon },
          ],
        },
        {
          title: 'Content',
          items: [{ label: 'Approvals', path: '/approvals', icon: CheckCheck }],
        },
        {
          title: 'Communication',
          items: [{ label: 'Notifications', path: '/notifications', icon: Bell }],
        },
      ]

    case 'CLIENT':
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Main',
          items: [
            { label: 'My Projects', path: '/projects', icon: FolderKanban },
            { label: 'Deliverables', path: '/content', icon: FileText },
            { label: 'Review & Approval', path: '/approvals', icon: CheckCheck },
          ],
        },
        {
          title: 'Finance',
          items: [{ label: 'Invoices', path: '/payments', icon: CreditCard }],
        },
        {
          title: 'Support',
          items: [
            { label: 'Feedback', path: '/revisions', icon: MessagesSquare },
            { label: 'Notifications', path: '/notifications', icon: Bell },
          ],
        },
      ]

    default:
      return [
        { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
        {
          title: 'Workspace',
          items: [
            { label: 'Clients', path: '/clients', icon: Users },
            { label: 'Projects', path: '/projects', icon: FolderKanban },
            { label: 'Tasks', path: '/tasks', icon: ListTodo },
            { label: 'Content', path: '/content', icon: FileText },
            { label: 'Media', path: '/media', icon: ImageIcon },
            { label: 'Approvals', path: '/approvals', icon: CheckCheck },
            { label: 'Revisions', path: '/revisions', icon: GitPullRequestArrow },
            { label: 'Payments', path: '/payments', icon: CreditCard },
            { label: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
            { label: 'Notifications', path: '/notifications', icon: Bell },
          ],
        },
      ]
  }
}
