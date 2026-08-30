import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, History, Save, FileText } from 'lucide-react'
import { useContentItem, useContentVersions, useUpdateContent, useSubmitContent } from '../hooks/useContent'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Input, Textarea, Label } from '@/components/ui/Field'
import { formatDate, formatRelative } from '@/utils/formatDate'
import { images } from '@/assets/images'

export function ContentEditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const { data: content, isLoading, isError, refetch } = useContentItem(id)
  const { data: versions } = useContentVersions(id)
  const versionList = Array.isArray(versions) ? versions : []
  const update = useUpdateContent(id)
  const submit = useSubmitContent()

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    cta: '',
    hashtags: '',
    seoMetaTitle: '',
    notes: '',
  })
  const [showVersions, setShowVersions] = useState(false)

  useEffect(() => {
    if (content) {
      setForm({
        title: content.title ?? '',
        shortDescription: content.shortDescription ?? '',
        longDescription: content.longDescription ?? '',
        cta: content.cta ?? '',
        hashtags: (content.hashtags ?? []).join(', '),
        seoMetaTitle: content.seoFields?.metaTitle ?? '',
        notes: content.notes ?? '',
      })
    }
  }, [content])

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError || !content) return <ErrorState onRetry={() => refetch()} />

  const canEdit = hasPermission(user?.role, user?.permissions, 'CONTENT_EDIT')
  const canSubmit = hasPermission(user?.role, user?.permissions, 'CONTENT_SUBMIT')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSave = async () => {
    await update.mutateAsync({
      title: form.title,
      shortDescription: form.shortDescription,
      longDescription: form.longDescription,
      cta: form.cta,
      hashtags: form.hashtags.split(',').map((h) => h.trim()).filter(Boolean),
      seoFields: { metaTitle: form.seoMetaTitle },
      notes: form.notes,
    })
    addToast({ type: 'success', title: 'Saved' })
  }

  const onSubmit = async () => {
    await submit.mutateAsync({ id, note: form.notes })
    addToast({ type: 'success', title: 'Submitted for review' })
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/content')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Content
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FileText className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
            <p className="text-sm text-muted-foreground">Version {content.currentVersion} · Created {formatDate(content.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={content.status} />
          <Button variant="outline" onClick={() => setShowVersions((s) => !s)}>
            <History className="h-4 w-4" /> Versions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={set('title')} disabled={!canEdit} className="mt-1.5" />
            </div>
            <div>
              <Label>Short Description</Label>
              <Input value={form.shortDescription} onChange={set('shortDescription')} disabled={!canEdit} className="mt-1.5" />
            </div>
            <div>
              <Label>Long Description</Label>
              <Textarea value={form.longDescription} onChange={set('longDescription')} disabled={!canEdit} rows={6} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>CTA</Label>
                <Input value={form.cta} onChange={set('cta')} disabled={!canEdit} className="mt-1.5" />
              </div>
              <div>
                <Label>Hashtags (comma separated)</Label>
                <Input value={form.hashtags} onChange={set('hashtags')} disabled={!canEdit} className="mt-1.5" placeholder="#brand, #launch" />
              </div>
            </div>
            <div>
              <Label>SEO Meta Title</Label>
              <Input value={form.seoMetaTitle} onChange={set('seoMetaTitle')} disabled={!canEdit} className="mt-1.5" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={set('notes')} disabled={!canEdit} rows={2} className="mt-1.5" />
            </div>
            {canEdit && (
              <div className="flex gap-2 pt-2">
                <Button onClick={onSave} loading={update.isPending}><Save className="h-4 w-4" /> Save</Button>
                {canSubmit && (
                  <Button variant="success" onClick={onSubmit} loading={submit.isPending}><Send className="h-4 w-4" /> Submit</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {showVersions && (
            <Card>
              <CardHeader><CardTitle>Version History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {versionList.length ? (
                  versionList.slice().reverse().map((v) => (
                    <div key={v.versionNumber} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Version {v.versionNumber}</span>
                        <StatusBadge status={v.approvalStatus} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {v.changes ? `${v.changes} · ` : ''}
                        {formatRelative(v.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No versions yet.</p>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="overflow-hidden">
            <img src={images.contentWriting} alt="" className="h-32 w-full object-cover" />
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-foreground">Review workflow</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submit content to move it into review. Approved content becomes visible to the client for final approval.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
