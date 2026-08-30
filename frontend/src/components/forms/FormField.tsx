import { Label, Input, Textarea, Select } from '@/components/ui/Field'
import { cn } from '@/utils/cn'

export function FormField({
  label,
  error,
  required,
  children,
  className,
  hint,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  hint?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

export { Label, Input, Textarea, Select }
