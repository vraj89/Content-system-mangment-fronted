import type { Role, Permission } from '@/types/permissions'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  MARKETING: [
    'CLIENT_CREATE',
    'CLIENT_VIEW',
    'CLIENT_SUBMIT',
    'PROJECT_VIEW',
    'PRODUCT_CREATE',
    'PRODUCT_VIEW',
    'PRODUCT_EDIT',
    'CONTENT_VIEW',
    'MEDIA_VIEW',
    'TASK_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
  ADMIN: [
    'CLIENT_CREATE',
    'CLIENT_VIEW',
    'CLIENT_APPROVE',
    'CLIENT_REJECT',
    'CLIENT_SUBMIT',
    'PROJECT_VIEW',
    'PROJECT_APPROVE',
    'PROJECT_PUBLISH',
    'PRODUCT_CREATE',
    'PRODUCT_VIEW',
    'PRODUCT_EDIT',
    'TASK_CREATE',
    'TASK_ASSIGN',
    'TASK_VIEW',
    'TASK_UPDATE',
    'CONTENT_CREATE',
    'CONTENT_EDIT',
    'CONTENT_SUBMIT',
    'CONTENT_APPROVE',
    'CONTENT_VIEW',
    'MEDIA_UPLOAD',
    'MEDIA_EDIT',
    'MEDIA_APPROVE',
    'MEDIA_VIEW',
    'PAYMENT_VIEW',
    'PAYMENT_UPDATE',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DISABLE',
    'USER_VIEW',
    'NOTIFICATION_VIEW',
    'COMMENT_CREATE',
    'AUDIT_VIEW',
    'ROLE_MANAGE',
  ],
  TASK_MANAGEMENT: [
    'PROJECT_VIEW',
    'USER_VIEW',
    'TASK_CREATE',
    'TASK_ASSIGN',
    'TASK_VIEW',
    'TASK_UPDATE',
    'CONTENT_VIEW',
    'MEDIA_VIEW',
    'PRODUCT_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
  CONTENT_TEAM: [
    'PROJECT_VIEW',
    'CONTENT_CREATE',
    'CONTENT_EDIT',
    'CONTENT_SUBMIT',
    'CONTENT_VIEW',
    'TASK_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
  MEDIA_TEAM: [
    'PROJECT_VIEW',
    'MEDIA_UPLOAD',
    'MEDIA_EDIT',
    'MEDIA_VIEW',
    'TASK_VIEW',
    'CONTENT_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
  CLIENT: [
    'PROJECT_VIEW',
    'PRODUCT_VIEW',
    'CONTENT_VIEW',
    'MEDIA_VIEW',
    'PAYMENT_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
}

export const ROLE_LABELS: Record<Role, string> = {
  MARKETING: 'Marketing',
  ADMIN: 'Admin',
  TASK_MANAGEMENT: 'Task Management',
  CONTENT_TEAM: 'Content Team',
  MEDIA_TEAM: 'Media Team',
  CLIENT: 'Client',
}

export function hasPermission(
  role: Role | undefined,
  permissions: Permission[] | undefined,
  required: Permission,
): boolean {
  if (!role) return false
  const set = permissions && permissions.length ? permissions : ROLE_PERMISSIONS[role]
  return set.includes(required)
}

export function hasAnyPermission(
  role: Role | undefined,
  permissions: Permission[] | undefined,
  required: Permission[],
): boolean {
  return required.some((p) => hasPermission(role, permissions, p))
}
