import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Replace, Play, Pause, Volume2, Maximize2, RotateCcw } from 'lucide-react'
import { useMediaItem, useReplaceMedia } from '../hooks/useMedia'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatRelative } from '@/utils/formatDate'
import { API_BASE_URL } from '@/lib/apiClient'

function mediaUrl(path?: string) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api/v1', '')}${path}`
}

export function MediaDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const { data: media, isLoading, isError, refetch } = useMediaItem(id)
  const replace = useReplaceMedia(id)
  const fileRef = useRef<HTMLInputElement>(null)
  const [playing, setPlaying] = useState(false)

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError || !media) return <ErrorState onRetry={() => refetch()} />

  const canReplace = hasPermission(user?.role, user?.permissions, 'MEDIA_UPLOAD')
  const src = mediaUrl(media.storageUrl ?? media.originalFile)

  const onReplace = async (files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('note', 'Replacement upload')
    try {
      await replace.mutateAsync(fd)
      addToast({ type: 'success', title: 'Media replaced' })
      refetch()
    } catch (e) {
      addToast({ type: 'error', title: 'Replace failed', description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/media')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Media
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{media.fileName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Version {media.version} · {formatDate(media.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={media.status} />
          {canReplace && (
            <Button variant="outline" onClick={() => fileRef.current?.click()} loading={replace.isPending}>
              <Replace className="h-4 w-4" /> Replace
            </Button>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => onReplace(e.target.files)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-center bg-slate-950 p-4">
            {media.fileType === 'video' && src ? (
              <video
                src={src}
                controls
                className="max-h-[60vh] w-full rounded-lg"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : media.fileType === 'image' && src ? (
              <img src={src} alt={media.fileName} className="max-h-[60vh] rounded-lg object-contain" />
            ) : (
              <div className="flex h-64 items-center justify-center text-white/70">No preview available</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="Type" value={media.fileType} />
              <Detail label="MIME" value={media.mimeType} />
              <Detail label="Resolution" value={media.resolution} />
              <Detail label="Status" value={media.status} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Version History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {media.versions?.length ? (
                media.versions.slice().reverse().map((v) => (
                  <div key={v.version} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">v{v.version}</span>
                      {v.approvalStatus && <StatusBadge status={v.approvalStatus} />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatRelative(v.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No previous versions.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || '—'}</span>
    </div>
  )
}
