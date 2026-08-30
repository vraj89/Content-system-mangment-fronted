import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  trend,
}: {
  title: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'accent' | 'neutral'
  hint?: string
  trend?: { value: string; positive?: boolean }
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    purple: 'bg-violet-50 text-violet-600',
    accent: 'bg-cyan-50 text-cyan-600',
    neutral: 'bg-slate-100 text-slate-600',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-5 card-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </motion.div>
  )
}
