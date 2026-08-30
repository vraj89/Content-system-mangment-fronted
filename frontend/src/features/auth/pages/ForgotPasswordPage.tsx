import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { forgotSchema, type ForgotValues } from '../schemas/auth.schema'
import { authApi } from '../api/auth.api'
import { ApiClientError } from '@/lib/apiClient'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/forms/FormField'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (values: ForgotValues) => {
    setServerError(null)
    try {
      await authApi.forgotPassword(values.email)
      setDone(true)
    } catch (e) {
      setServerError((e as ApiClientError).message)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We'll send a reset link to your email address.
      </p>

      {done ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-medium text-emerald-800">Check your inbox</p>
          <p className="mt-1 text-sm text-emerald-700">
            If an account exists, a password reset link has been sent.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {serverError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          )}
          <FormField label="Email" error={errors.email?.message} required>
            <Input type="email" placeholder="you@company.com" {...register('email')} />
          </FormField>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </motion.div>
  )
}
