import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { authApi } from '@/features/auth/api/auth.api'
import { useUIStore } from '@/stores/ui.store'
import { ApiClientError } from '@/lib/apiClient'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/forms/FormField'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ROLE_LABELS } from '@/lib/permissions'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'At least 6 characters'),
})
type Values = z.infer<typeof schema>

export function ProfilePage() {
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: Values) => {
    setServerError(null)
    try {
      await authApi.changePassword(v.currentPassword, v.newPassword)
      addToast({ type: 'success', title: 'Password updated' })
      reset()
    } catch (e) {
      setServerError((e as ApiClientError).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & Settings" description="Your account details and security." image={images.dashboardClient} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar name={user?.name} size="lg" />
            <p className="mt-3 text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={user?.status} />
              <span className="text-xs text-muted-foreground">{ROLE_LABELS[user?.role ?? 'CLIENT']}</span>
            </div>
            {user?.createdAt && <p className="mt-3 text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            {serverError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{serverError}</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
              <FormField label="Current Password" error={errors.currentPassword?.message} required>
                <Input type="password" {...register('currentPassword')} />
              </FormField>
              <FormField label="New Password" error={errors.newPassword?.message} required>
                <Input type="password" {...register('newPassword')} />
              </FormField>
              <Button type="submit" loading={isSubmitting}>Update Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
