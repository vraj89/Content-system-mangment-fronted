import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import type { Role } from '@/types/permissions'
import { ErrorState } from '@/components/ui/EmptyState'

export function RoleRoute({
  roles,
  children,
  redirect = false,
}: {
  roles: Role[]
  children: React.ReactNode
  redirect?: boolean
}) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    if (redirect) return <Navigate to="/dashboard" replace />
    return (
      <div className="p-6">
        <ErrorState
          title="This area is not available for your role"
          description="Switch to an appropriate account to access this section."
        />
      </div>
    )
  }
  return <>{children}</>
}
