import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { hasPermission } from '@/lib/permissions'
import type { Permission } from '@/types/permissions'
import { ErrorState } from '@/components/ui/EmptyState'

export function PermissionRoute({
  permission,
  children,
  redirect = false,
}: {
  permission: Permission | Permission[]
  children: React.ReactNode
  redirect?: boolean
}) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  const perms = Array.isArray(permission) ? permission : [permission]
  const allowed = perms.some((p) => hasPermission(user.role, user.permissions, p))
  if (!allowed) {
    if (redirect) return <Navigate to="/dashboard" replace />
    return (
      <div className="p-6">
        <ErrorState
          title="You don't have permission to view this page"
          description="Contact an administrator if you believe this is a mistake."
        />
      </div>
    )
  }
  return <>{children}</>
}
