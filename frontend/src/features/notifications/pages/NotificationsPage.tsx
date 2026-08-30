import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { images } from '@/assets/images'
import { formatDateTime } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export function NotificationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data, isLoading, isError, refetch } = useNotifications({ unread: unreadOnly || undefined, page, limit: 12 })
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay on top of approvals, revisions and updates."
        image={images.dashboardClient}
        actions={
          <Button variant="outline" onClick={() => markAll.mutate()}><CheckCheck className="h-4 w-4" /> Mark all read</Button>
        }
      />

      <div className="flex items-center gap-2">
        <Button variant={!unreadOnly ? 'secondary' : 'outline'} size="sm" onClick={() => { setUnreadOnly(false); setPage(1) }}>All</Button>
        <Button variant={unreadOnly ? 'secondary' : 'outline'} size="sm" onClick={() => { setUnreadOnly(true); setPage(1) }}>Unread</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.notifications.length ? (
        <Card>
          <div className="divide-y divide-border">
            {data.notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => { if (!n.read) markRead.mutate(n._id); if (n.projectId) navigate(`/projects/${n.projectId}`) }}
                className={cn('flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50 sm:px-5', !n.read && 'bg-primary/5')}
              >
                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.read && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">New</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Check className="h-4 w-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); markRead.mutate(n._id) }} />
                )}
              </button>
            ))}
          </div>
          {data.meta && <div className="border-t border-border p-4"><Pagination meta={data.meta} onPageChange={setPage} /></div>}
        </Card>
      ) : (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" description="You're all caught up." />
      )}
    </div>
  )
}
