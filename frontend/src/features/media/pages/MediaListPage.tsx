import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { UploadCloud, Image as ImageIcon, Search, Video, FileText, X } from 'lucide-react'
import { useMedia, useUploadMedia } from '../hooks/useMedia'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useTasks, useTaskStatus } from '@/features/tasks/hooks/useTasks'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Progress } from '@/components/ui/Progress'
import { images } from '@/assets/images'
import { API_BASE_URL } from '@/lib/apiClient'
import { formatDate } from '@/utils/formatDate'

function mediaUrl(path?: string) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api/v1', '')}${path}`
}

export function MediaListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const debounced = useDebounce(search)
  useEffect(() => { /* reset page if needed */ }, [debounced, fileType])

  const { data, isLoading, isError, refetch } = useMedia({
    search: debounced || undefined,
    fileType: fileType || undefined,
    status: statusFilter || undefined,
    limit: 24,
  })
  const { data: projectsData } = useProjects({ limit: 100 })
  const projects = projectsData?.projects ?? []
  const { data: tasksData } = useTasks({ assignedTeam: 'MEDIA_TEAM', limit: 100 })
  const allMediaTasks = tasksData?.tasks ?? []
  const tasksForProject = selectedProjectId
    ? allMediaTasks.filter((t) => {
        const pid = typeof t.projectId === 'string' ? t.projectId : (t.projectId as unknown as { _id: string })?._id
        return pid === selectedProjectId
      })
    : []
  const upload = useUploadMedia()
  const taskStatus = useTaskStatus()
  const canUpload = hasPermission(user?.role, user?.permissions, 'MEDIA_UPLOAD')

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files.length) return
    if (!selectedProjectId) {
      addToast({ type: 'error', title: 'Project required', description: 'Please select a project before attaching media.' })
      return
    }
    if (!selectedTaskId) {
      addToast({ type: 'error', title: 'Linked Task required', description: 'Please select a MEDIA task for the chosen project.' })
      return
    }
    setPendingFile(files[0])
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSendForApproval = async () => {
    if (!pendingFile) {
      addToast({ type: 'error', title: 'No file attached', description: 'Please attach a file before sending for approval.' })
      return
    }
    if (!selectedProjectId || !selectedTaskId) {
      addToast({ type: 'error', title: 'Project & Task required', description: 'Select both Project and Linked Task before submitting.' })
      return
    }
    const fd = new FormData()
    fd.append('file', pendingFile)
    fd.append('projectId', selectedProjectId)
    fd.append('taskId', selectedTaskId)
    fd.append('fileType', pendingFile.type.startsWith('video') ? 'video' : pendingFile.type.startsWith('image') ? 'image' : 'document')
    setUploading(true)
    setUploadProgress(20)
    try {
      await upload.mutateAsync(fd)
      setUploadProgress(100)
      // Move linked task so Task Manager sees it in review queue
      try {
        await taskStatus.mutateAsync({ id: selectedTaskId, status: 'IN_REVIEW' })
      } catch {
        try {
          await taskStatus.mutateAsync({ id: selectedTaskId, status: 'IN_PROGRESS' })
        } catch {
          // Non-blocking: already in correct state or transition not allowed
        }
      }
      addToast({ type: 'success', title: 'Sent for approval', description: `${pendingFile.name} uploaded — sent to Task Manager for review.` })
      setPendingFile(null)
      if (fileRef.current) fileRef.current.value = ''
      refetch()
    } catch (e) {
      addToast({ type: 'error', title: 'Upload failed', description: (e as Error).message })
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0) }, 600)
    }
  }

  const clearPending = () => {
    setPendingFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Keep immediate drop handling for backwards compat, but route through attach step
  const handleFiles = async (files: FileList | null) => {
    handleFileSelect(files)
  }

  const canUploadReady = canUpload && !!selectedProjectId && !!selectedTaskId

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Upload, process and review media assets."
        image={images.videoEditing}
        actions={
          canUpload ? (
            <Button
              onClick={() => {
                if (!selectedProjectId) {
                  addToast({ type: 'error', title: 'Project required', description: 'Please select a project before uploading.' })
                  return
                }
                if (!selectedTaskId) {
                  addToast({ type: 'error', title: 'Linked Task required', description: 'Please select a MEDIA task for the chosen project.' })
                  return
                }
                fileRef.current?.click()
              }}
            >
              <UploadCloud className="h-4 w-4" /> Add Media
            </Button>
          ) : undefined
        }
      />

      <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {canUpload && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Project <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value)
                  setSelectedTaskId('')
                }}
                data-testid="media-project-select"
                className={!selectedProjectId ? 'border-amber-300' : ''}
              >
                <option value="">Select project *</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </Select>
              {!selectedProjectId && <p className="mt-1 text-xs text-amber-600">Select a project to enable upload</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Linked Task <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                data-testid="media-task-select"
                disabled={!selectedProjectId}
                className={!selectedTaskId ? 'border-amber-300' : ''}
              >
                <option value="">{!selectedProjectId ? 'Select a project first' : tasksForProject.length ? 'Select linked MEDIA task *' : 'No MEDIA tasks for this project'}</option>
                {tasksForProject.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </Select>
              {!selectedTaskId && (
                <p className="mt-1 text-xs text-amber-600">
                  {!selectedProjectId ? 'Select a project first' : tasksForProject.length ? 'Select a MEDIA task to enable upload' : 'No MEDIA tasks — create one in Tasks for this project'}
                </p>
              )}
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => {
              if (!selectedProjectId) {
                addToast({ type: 'error', title: 'Project required', description: 'Please select a project before uploading.' })
                return
              }
              if (!selectedTaskId) {
                addToast({ type: 'error', title: 'Linked Task required', description: 'Please select a MEDIA task for the chosen project.' })
                return
              }
              fileRef.current?.click()
            }}
            data-testid="media-dropzone"
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${!canUploadReady ? 'opacity-60' : ''} ${dragOver ? 'border-primary bg-primary/5' : 'border-border bg-card'} ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <UploadCloud className={`h-8 w-8 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="mt-2 text-sm font-medium text-foreground">Drag & drop or click to attach</p>
            <p className="text-xs text-muted-foreground">Images, videos and documents</p>
            {!canUploadReady && (
              <p className="mt-1 text-xs font-medium text-amber-600">
                {!selectedProjectId ? 'Project required before attach' : !selectedTaskId ? 'Linked Task required before attach' : ''}
              </p>
            )}
            {uploading && (
              <div className="mt-4 w-full max-w-xs">
                <Progress value={uploadProgress} />
                <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>
              </div>
            )}
          </div>

          {pendingFile && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3" data-testid="media-pending-attach">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium text-foreground">{pendingFile.name}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {(pendingFile.size / 1024).toFixed(1)} KB · {projects.find((p) => p._id === selectedProjectId)?.name} · {tasksForProject.find((t) => t._id === selectedTaskId)?.title}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearPending} data-testid="media-clear-attach">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={handleSendForApproval} loading={uploading || taskStatus.isPending} data-testid="media-send-approval">
                  <UploadCloud className="h-4 w-4" /> Send for Approval
                </Button>
                <Button variant="outline" onClick={handleSendForApproval} loading={uploading || taskStatus.isPending} data-testid="media-submit">
                  Submit
                </Button>
                <span className="ml-1 self-center text-xs text-muted-foreground">→ Task Manager will review</span>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search media..." className="pl-9" />
          </div>
          <Select value={fileType} onChange={(e) => setFileType(e.target.value)} className="sm:w-48">
            <option value="">All types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UPLOADING">Uploading</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY_FOR_REVIEW">Ready for Review</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="APPROVED">Approved</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.media.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.media.map((m) => (
            <Card key={m._id} hover className="cursor-pointer overflow-hidden" onClick={() => navigate(`/media/${m._id}`)}>
              <div className="relative h-40 overflow-hidden bg-muted">
                {m.fileType === 'video' ? (
                  <div className="flex h-full items-center justify-center bg-slate-900">
                    {m.thumbnail ? <img src={mediaUrl(m.thumbnail)} alt="" className="h-full w-full object-cover opacity-80" /> : <Video className="h-10 w-10 text-white/70" />}
                    <span className="absolute inset-0 flex items-center justify-center"><Video className="h-10 w-10 text-white/80" /></span>
                  </div>
                ) : m.fileType === 'image' ? (
                  <img src={mediaUrl(m.thumbnail ?? m.storageUrl ?? m.originalFile)} alt={m.fileName} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary"><FileText className="h-10 w-10 text-muted-foreground" /></div>
                )}
                <div className="absolute left-2 top-2"><StatusBadge status={m.status} /></div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-foreground">{m.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ImageIcon className="h-6 w-6" />} title="No media yet" description="Upload your first asset to get started." />
      )}
    </div>
  )
}
