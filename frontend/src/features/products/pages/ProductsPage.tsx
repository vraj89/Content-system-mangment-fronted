import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Search } from 'lucide-react'
import { useProducts, useCreateProduct } from '../hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/forms/FormField'
import { Drawer } from '@/components/ui/Drawer'
import { images } from '@/assets/images'
import { formatDate } from '@/utils/formatDate'

export function ProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<import('../hooks/useProducts').Product | null>(null)
  const debounced = useDebounce(search)
  useEffect(() => {}, [debounced])

  const { data, isLoading, isError, refetch } = useProducts({ search: debounced || undefined, limit: 30 })
  const create = useCreateProduct()
  const canCreate = hasPermission(user?.role, user?.permissions, 'PRODUCT_CREATE')

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const product = await create.mutateAsync({
      name: String(fd.get('name') || ''),
      description: String(fd.get('description') || '') || undefined,
      features: String(fd.get('features') || '').split('\n').map((s) => s.trim()).filter(Boolean),
      benefits: String(fd.get('benefits') || '').split('\n').map((s) => s.trim()).filter(Boolean),
      requirements: String(fd.get('requirements') || '') || undefined,
      projectId: String(fd.get('projectId') || '') || undefined,
      clientId: String(fd.get('clientId') || '') || undefined,
    })
    addToast({ type: 'success', title: 'Product created' })
    setOpen(false)
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Product catalogs linked to clients and projects."
        image={images.marketingTeam}
        actions={canCreate ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Product</Button> : undefined}
      />
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.products.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.products.map((p) => (
            <Card key={p._id} hover className="cursor-pointer p-5" onClick={() => setSelected(p)}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></div>
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
              </div>
              {p.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Package className="h-6 w-6" />} title="No products" description="Create a product to attach to a project." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Product" description="Add a product to the catalog.">
        <form onSubmit={onCreate} className="space-y-4">
          <FormField label="Name" required><Input name="name" required placeholder="Product name" /></FormField>
          <FormField label="Description"><textarea name="description" rows={3} className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormField>
          <FormField label="Features (one per line)"><textarea name="features" rows={3} className="flex min-h-[70px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormField>
          <FormField label="Benefits (one per line)"><textarea name="benefits" rows={2} className="flex min-h-[50px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormField>
          <FormField label="Requirements"><Input name="requirements" /></FormField>
          <FormField label="Project ID"><Input name="projectId" placeholder="Optional" /></FormField>
          <FormField label="Client ID"><Input name="clientId" placeholder="Optional" /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name} footer={<Button variant="outline" onClick={() => setSelected(null)}>Close</Button>}>
        {selected && (
          <div className="space-y-4">
            {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
            {selected.features?.length ? (
              <div><p className="text-sm font-semibold">Features</p><ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{selected.features.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            ) : null}
            {selected.benefits?.length ? (
              <div><p className="text-sm font-semibold">Benefits</p><ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{selected.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
            ) : null}
            {selected.requirements && <p className="text-sm text-muted-foreground"><span className="font-semibold">Requirements: </span>{selected.requirements}</p>}
          </div>
        )}
      </Drawer>
    </div>
  )
}
