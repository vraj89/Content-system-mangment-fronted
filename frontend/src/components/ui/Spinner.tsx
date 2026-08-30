import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return <Loader2 className={cn('animate-spin text-current', className)} style={{ width: size, height: size }} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}
