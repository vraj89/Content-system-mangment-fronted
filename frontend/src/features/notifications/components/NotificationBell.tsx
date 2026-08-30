import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useUnreadCount, useNotifications, useMarkAllRead, useMarkRead } from '../hooks/useNotifications'
import { formatRelative } from '@/utils/formatDate'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: count } = useUnreadCount()
  const { data, isLoading } = useNotifications({ page: 1, limit: 6 })
  const markAll = useMarkAllRead()
  const markRead = useMarkRead()

  const unread = count?.count ?? 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={() => markAll.mutate()}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : data?.notifications.length ? (
                  data.notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n._id)
                        setOpen(false)
                        if (n.projectId) navigate(`/projects/${n.projectId}`)
                        else navigate('/notifications')
                      }}
                      className={cn(
                        'flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary',
                        !n.read && 'bg-primary/5',
                      )}
                    >
                      <div
                        className={cn(
                          'mt-1 h-2 w-2 shrink-0 rounded-full',
                          n.read ? 'bg-transparent' : 'bg-primary',
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelative(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
                )}
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/notifications')
                }}
                className="block w-full border-t border-border py-2.5 text-center text-sm font-medium text-primary hover:bg-secondary"
              >
                View all
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
