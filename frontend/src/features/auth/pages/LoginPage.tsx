import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { loginSchema, type LoginValues } from '../schemas/auth.schema'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '@/stores/ui.store'
import { ApiClientError } from '@/lib/apiClient'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/forms/FormField'
import { ROLE_LABELS } from '@/lib/permissions'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const addToast = useUIStore((s) => s.addToast)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const demoAccounts = [
    { role: 'ADMIN', email: 'admin@csm.app', label: 'Admin' },
    { role: 'MARKETING', email: 'marketing@csm.app', label: 'Marketing' },
    { role: 'TASK_MANAGEMENT', email: 'taskmanager@csm.app', label: 'Task Manager' },
    { role: 'CONTENT_TEAM', email: 'content@csm.app', label: 'Content Team' },
    { role: 'MEDIA_TEAM', email: 'media@csm.app', label: 'Media Team' },
    { role: 'CLIENT', email: 'client@csm.app', label: 'Client' },
  ] as const

  const quickLogin = (email: string) => {
    setValue('email', email)
    setValue('password', 'Password123!')
    void handleSubmit(onSubmit)()
  }

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    try {
      const user = await login(values.email, values.password)
      addToast({ type: 'success', title: 'Welcome back!', description: `Signed in as ${ROLE_LABELS[user.role]}` })
      const to = (location.state as { from?: string })?.from ?? '/dashboard'
      navigate(to, { replace: true })
    } catch (e) {
      const err = e as ApiClientError
      if (err.status === 403) {
        setServerError('Your account is locked or inactive. Please contact an administrator.')
      } else {
        setServerError(err.message ?? 'Unable to sign in. Check your credentials.')
      }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter your credentials to access the workspace.
      </p>

      {serverError && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField label="Email" error={errors.email?.message} required>
          <Input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
        </FormField>
        <FormField label="Password" error={errors.password?.message} required>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </FormField>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Demo accounts · password <code className="text-foreground">Password123!</code>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => quickLogin(a.email)}
              disabled={isSubmitting}
              className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-medium transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              <span className="block text-foreground">{a.label}</span>
              <span className="block truncate text-muted-foreground">{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
