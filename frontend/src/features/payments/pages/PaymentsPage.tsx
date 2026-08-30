import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Plus, Search, Eye, EyeOff } from 'lucide-react'
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment } from '../hooks/usePayments'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/features/auth'
import { hasPermission } from '@/lib/permissions'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/forms/FormField'
import { images } from '@/assets/images'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate as fd } from '@/utils/formatDate'

export function PaymentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(search)
  useEffect(() => {}, [debounced])

  const isClient = user?.role === 'CLIENT'
  const canManage = hasPermission(user?.role, user?.permissions, 'PAYMENT_UPDATE')
  const { data, isLoading, isError, refetch } = usePayments({ search: debounced || undefined, limit: 30 })
  const create = useCreatePayment()
  const del = useDeletePayment()

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await create.mutateAsync({
      invoiceNumber: String(fd.get('invoiceNumber') || ''),
      amount: Number(fd.get('amount') || 0),
      currency: String(fd.get('currency') || 'USD'),
      notes: String(fd.get('notes') || ''),
      projectId: String(fd.get('projectId') || '') || undefined,
      dueDate: fd.get('dueDate') ? String(fd.get('dueDate')) : undefined,
      visibleToClient: fd.get('visibleToClient') === 'on',
    })
    addToast({ type: 'success', title: 'Payment created' })
    setOpen(false)
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={isClient ? 'Your invoices and payment status.' : 'Manage invoices, payments and dues.'}
        image={images.dashboardClient}
        actions={canManage ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Invoice</Button> : undefined}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={26} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data?.payments.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.payments.map((p) => (
            <Card key={p._id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.amount, p.currency)}</p>
                </div>
                <StatusBadge status={p.paymentStatus} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Paid</span><span className="text-foreground">{formatCurrency(p.paidAmount ?? 0, p.currency)}</span></div>
                <div className="flex justify-between"><span>Remaining</span><span className="text-foreground">{formatCurrency(p.remainingAmount ?? p.amount, p.currency)}</span></div>
                {p.dueDate && <div className="flex justify-between"><span>Due</span><span className="text-foreground">{fd(p.dueDate)}</span></div>}
                {canManage && (
                  <div className="flex items-center gap-1 pt-1 text-xs">
                    {p.visibleToClient ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {p.visibleToClient ? 'Visible to client' : 'Hidden from client'}
                  </div>
                )}
              </div>
              {canManage && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/payments/${p._id}`)}>Manage</Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(p._id)}>Delete</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No payments" description={isClient ? 'No invoices are available to you yet.' : 'Create an invoice to get started.'} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Invoice" description="Create a payment record.">
        <form onSubmit={onCreate} className="space-y-4">
          <FormField label="Invoice Number" required><Input name="invoiceNumber" required placeholder="INV-001" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount" required><Input name="amount" type="number" step="0.01" required placeholder="0.00" /></FormField>
            <FormField label="Currency"><Input name="currency" defaultValue="USD" /></FormField>
          </div>
          <FormField label="Project ID"><Input name="projectId" placeholder="Optional" /></FormField>
          <FormField label="Due Date"><Input name="dueDate" type="date" /></FormField>
          <FormField label="Notes"><textarea name="notes" rows={2} className="flex min-h-[50px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormField>
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" name="visibleToClient" className="h-4 w-4 rounded border-input" /> Visible to client</label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
