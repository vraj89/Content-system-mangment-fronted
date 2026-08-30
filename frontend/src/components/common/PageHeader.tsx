import { cn } from '@/utils/cn'

export function PageHeader({
  title,
  description,
  actions,
  image,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  image?: string
  className?: string
}) {
  if (image) {
    return (
      <div className={cn('relative overflow-hidden rounded-2xl', className)}>
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-slate-900/40" />
        <div className="relative flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div className="text-white">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="mt-1.5 max-w-2xl text-sm text-white/80">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
