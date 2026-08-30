import { useState } from 'react'
import { Send } from 'lucide-react'
import { useComments, useCreateComment } from '../hooks/useComments'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatRelative } from '@/utils/formatDate'
import { useAuth } from '@/features/auth'
import { ROLE_LABELS } from '@/lib/permissions'

export function CommentsThread({
  entityType,
  entityId,
  projectId,
}: {
  entityType: string
  entityId: string
  projectId?: string
}) {
  const { data, isLoading } = useComments({ entityType, entityId })
  const create = useCreateComment()
  const { user } = useAuth()
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (!message.trim()) return
    await create.mutateAsync({ entityType, entityId, projectId, message })
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : data?.comments.length ? (
          data.comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <Avatar name={c.authorName} size="sm" />
              <div className="flex-1 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.authorName}</span>
                  {c.role && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {ROLE_LABELS[c.role as keyof typeof ROLE_LABELS] ?? c.role}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/90">{c.message}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        )}
      </div>
      <div className="flex items-end gap-2">
        <Avatar name={user?.name} size="sm" />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="icon" onClick={submit} loading={create.isPending} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
