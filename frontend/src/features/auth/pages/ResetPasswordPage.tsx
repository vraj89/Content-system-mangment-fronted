import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { resetSchema, type ResetValues } from '../schemas/auth.schema'
import { authApi } from '../api/auth.api'
import { ApiClientError } from '@/lib/apiClient'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/forms/FormField'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (values: ResetValues) => {
    setServerError(null)
    try {
      await authApi.resetPassword(token, values.password)
      setDone(true)
    } catch (e) {
      setServerError((e as ApiClientError).message)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Choose a strong password for your account.</p>

      {done ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-medium text-emerald-800">Password updated</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 text-sm font-medium text-primary hover:underline"
          >
            Continue to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          )}
          {!token && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No reset token found in the URL. Use the link from your email.
            </div>
          )}
          <FormField label="New password" error={errors.password?.message} required>
            <Input type="password" placeholder="••••••••" {...register('password')} />
          </FormField>
          <FormField label="Confirm password" error={errors.confirm?.message} required>
            <Input type="password" placeholder="••••••••" {...register('confirm')} />
          </FormField>
          <Button type="submit" className="w-full" loading={isSubmitting} disabled={!token}>
            Update password
          </Button>
          <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </motion.div>
  )
}
