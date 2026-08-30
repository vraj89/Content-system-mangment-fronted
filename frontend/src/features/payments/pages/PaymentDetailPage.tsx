import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { usePayment, useUpdatePayment, useDeletePayment } from '../hooks/usePayments'
import { useUIStore } from '@/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { FormField, Input } from '@/components/forms/FormField'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { useState } from 'react'

export function PaymentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const { data: payment, isLoading, isError, refetch } = usePayment(id)
  const update = useUpdatePayment(id)
  const del = useDeletePayment()
  const [paidAmount, setPaidAmount] = useState('')

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size={26} /></div>
  if (isError || !payment) return <ErrorState onRetry={() => refetch()} />

  const onSave = async () => {
    const amt = Number(paidAmount)
    if (Number.isNaN(amt)) return
    await update.mutateAsync({ paidAmount: amt })
    addToast({ type: 'success', title: 'Payment updated' })
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/payments')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{payment.invoiceNumber}</h1>
        <StatusBadge status={payment.paymentStatus} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Update Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground">Total</p><p className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</p></div>
              <div><p className="text-muted-foreground">Paid</p><p className="font-semibold">{formatCurrency(payment.paidAmount ?? 0, payment.currency)}</p></div>
              <div><p className="text-muted-foreground">Remaining</p><p className="font-semibold">{formatCurrency(payment.remainingAmount ?? payment.amount, payment.currency)}</p></div>
            </div>
            <FormField label="Record Paid Amount" hint="Server recomputes remaining & status">
              <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0.00" />
            </FormField>
            <div className="flex gap-2">
              <Button onClick={onSave} loading={update.isPending}><Save className="h-4 w-4" /> Save</Button>
              <Button variant="destructive" onClick={() => { del.mutate(id); navigate('/payments') }}>Delete</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Due: </span>{payment.dueDate ? formatDate(payment.dueDate) : '—'}</p>
            <p><span className="text-muted-foreground">Method: </span>{payment.paymentMethod || '—'}</p>
            <p><span className="text-muted-foreground">Visible to client: </span>{payment.visibleToClient ? 'Yes' : 'No'}</p>
            {payment.notes && <p className="text-muted-foreground">{payment.notes}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
