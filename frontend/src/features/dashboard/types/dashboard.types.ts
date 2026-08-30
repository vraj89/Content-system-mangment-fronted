export interface ActivityItem {
  _id: string
  description?: string
  action?: string
  entityType?: string
  createdAt: string
  userId?: string
  role?: string
}

export interface DashboardData {
  // Marketing
  totalClients?: number
  pendingApprovals?: number
  approvedClients?: number
  rejectedSubmissions?: number
  activeProjects?: number
  recentSubmissions?: Array<{
    _id: string
    companyName?: string
    status?: string
    createdAt: string
  }>
  // Admin
  pendingTasks?: number
  contentAwaitingReview?: number
  mediaAwaitingReview?: number
  revisionRequests?: number
  pendingPayments?: number
  overduePayments?: number
  readyToPublish?: number
  activityTimeline?: ActivityItem[]
  // Task Management
  totalTasks?: number
  assignedTasks?: number
  inProgressTasks?: number
  overdueTasks?: number
  completedTasks?: number
  teamWorkload?: Array<{ _id: string | null; count?: number; name?: string; pending?: number; completed?: number }>
  teamSize?: number
  // Content Team (backend: assignedTasks, drafts, submittedContent, revisionRequests, approvedContent)
  contentAssignedTasks?: number
  drafts?: number
  submittedContent?: number
  approvedContent?: number
  upcomingDeadlines?: Array<{ _id: string; title: string; dueDate: string }>
  // Media Team
  assignedMediaTasks?: number
  uploadQueue?: number
  processingFiles?: number
  reviewPending?: number
  approvedMedia?: number
  // Client
  projectProgress?: Array<{ _id: string; name: string; progress: number }>
  clientPendingApprovals?: number
  paymentStatus?: Array<{ _id: string; projectId?: string; paymentStatus: string }>
  recentActivity?: ActivityItem[]
}
