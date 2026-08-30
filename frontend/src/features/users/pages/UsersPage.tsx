import { useState, useEffect } from 'react'
import { Search, UserCog, ShieldOff } from 'lucide-react'
import { useUsers, useDisableUser, useSetPermissions } from '../hooks/useUsers'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/permissions'
import { PERMISSIONS } from '@/types/permissions'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

export function UsersPage() {
  const { user: me } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [permOpen, setPermOpen] = useState<{ id: string; perms: string[] } | null>(null)
  const debounced = useDebounce(search)
  useEffect(() => {}, [debounced, role])

  const { data, isLoading, isError, refetch } = useUsers({ search: debounced || undefined, role: role || undefined, limit: 30 })
  const disable = useDisableUser()
  const setPerms = useSetPermissions()

  const togglePerm = (perm: string) => {
    if (!permOpen) return
    const has = permOpen.perms.includes(perm)
    setPermOpen({ ...permOpen, perms: has ? permOpen.perms.filter((p) => p !== perm) : [...permOpen.perms, perm] })
  }

  const savePerms = async () => {
    if (!permOpen) return
    await setPerms.mutateAsync({ id: permOpen.id, permissions: permOpen.perms })
    addToast({ type: 'success', title: 'Permissions updated' })
    setPermOpen(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage team members, roles and permissions." image={images.adminSquad} />
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-52">
            <option value="">All roles</option>
            {Object.keys(ROLE_LABELS).map((r) => <option key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS]}</option>)}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.users.length ? (
        <Card>
          <div className="divide-y divide-border">
            {data.users.map((u) => (
              <div key={u._id} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} />
                  <div>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={u.status} />
                  <span className="hidden text-xs text-muted-foreground sm:block">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</span>
                  {u._id !== me?._id && (
                    <Button size="sm" variant="outline" onClick={() => disable.mutate(u._id)}><ShieldOff className="h-3.5 w-3.5" /> Disable</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState icon={<UserCog className="h-6 w-6" />} title="No users" description="No users match your filters." />
      )}

      <Modal open={!!permOpen} onClose={() => setPermOpen(null)} title="Manage Permissions" description="Toggle permissions for this user."
        footer={<><Button variant="outline" onClick={() => setPermOpen(null)}>Cancel</Button><Button onClick={savePerms} loading={setPerms.isPending}>Save</Button></>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PERMISSIONS.map((p) => {
            const active = permOpen?.perms.includes(p)
            return (
              <button key={p} onClick={() => togglePerm(p)} className={`rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                {p.replace(/_/g, ' ')}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
