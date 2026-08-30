export interface Notification {
  _id: string
  recipientId: string
  type: string
  title: string
  message: string
  entityType?: string
  entityId?: string
  projectId?: string
  read: boolean
  readAt?: string
  metadata?: Record<string, unknown>
  deliveredEmail?: boolean
  createdAt: string
}
