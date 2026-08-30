import { cn } from '@/utils/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  meta,
  onPageChange,
  className,
}: {
  meta: { page: number; limit: number; total: number; totalPages: number }
  onPageChange: (page: number) => void
  className?: string
}) {
  const { page, totalPages, total } = meta
  if (totalPages <= 1 && total === 0) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    if (p === 1 || p === totalPages) return true
    return Math.abs(p - page) <= 1
  })

  const items: (number | '...')[] = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) items.push('...')
    items.push(p)
    prev = p
  }

  return (
    <div className={cn('flex items-center justify-between gap-3 pt-2', className)}>
      <p className="text-sm text-muted-foreground">
        {total === 0 ? 'No results' : `Page ${page} of ${totalPages} · ${total} items`}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {items.map((it, i) =>
          it === '...' ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={it}
              onClick={() => onPageChange(it)}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors',
                it === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              {it}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
