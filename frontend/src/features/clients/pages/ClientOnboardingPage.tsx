import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'
import { clientSchema, type ClientFormValues } from '../schemas/clients.schema'
import { useCreateClient, useUpdateClient, useSubmitClient } from '../hooks/useClients'
import { useUIStore } from '@/stores/ui.store'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Textarea } from '@/components/forms/FormField'
import { cn } from '@/utils/cn'

const STEPS = ['Company', 'Contact', 'Product', 'Campaign', 'Review'] as const

const STEP_FIELDS: Record<number, (keyof ClientFormValues)[]> = {
  0: ['companyName'],
  1: ['clientName', 'email', 'phone', 'whatsappNumber', 'address'],
  2: ['industry', 'website', 'productInformation'],
  3: ['campaignInformation', 'requirements', 'notes'],
  4: [],
}

export function ClientOnboardingPage() {
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const [step, setStep] = useState(0)
  const [clientId, setClientId] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)

  const createClient = useCreateClient()
  const updateClient = useUpdateClient(clientId ?? '')
  const submitClient = useSubmitClient()

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange',
    defaultValues: { companyName: '', email: '', clientName: '', phone: '', whatsappNumber: '', address: '', industry: '', website: '', productInformation: '', campaignInformation: '', requirements: '', notes: '' },
  })

  const saveDraft = async (): Promise<string> => {
    const values = getValues()
    if (!clientId) {
      // Draft creation only needs the minimum required fields
      const created = await createClient.mutateAsync({
        companyName: values.companyName || 'Untitled Client',
        email: values.email || 'draft@client.local',
      })
      setClientId(created._id)
      return created._id
    }
    await updateClient.mutateAsync({
      companyName: values.companyName,
      email: values.email,
      clientName: values.clientName,
      phone: values.phone,
      whatsappNumber: values.whatsappNumber,
      address: values.address,
      industry: values.industry,
      website: values.website,
      productInformation: values.productInformation,
      campaignInformation: values.campaignInformation,
      requirements: values.requirements,
      notes: values.notes,
    })
    return clientId
  }

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) return
    if (step === 0 || !clientId) {
      setSavingDraft(true)
      try {
        await saveDraft()
      } finally {
        setSavingDraft(false)
      }
    } else {
      setSavingDraft(true)
      try {
        await saveDraft()
      } finally {
        setSavingDraft(false)
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (values: ClientFormValues) => {
    try {
      const id = clientId ?? (await saveDraft())
      await submitClient.mutateAsync({ id, note: values.notes })
      addToast({ type: 'success', title: 'Client submitted', description: 'Awaiting admin approval.' })
      navigate(`/clients/${id}`)
    } catch (e) {
      addToast({ type: 'error', title: 'Submission failed', description: (e as Error).message })
    }
  }

  const v = getValues()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Onboarding"
        description="Complete each step to submit a new client for approval."
      />

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  i < step
                    ? 'bg-success text-success-foreground'
                    : i === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('hidden text-sm font-medium sm:block', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-3 h-0.5 flex-1 rounded-full', i < step ? 'bg-success' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <FormField label="Company Name" error={errors.companyName?.message} required>
                    <Input placeholder="Acme Corporation" {...register('companyName')} />
                  </FormField>
                </div>
              )}
              {step === 1 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Primary Contact" error={errors.clientName?.message}>
                    <Input placeholder="Jane Doe" {...register('clientName')} />
                  </FormField>
                  <FormField label="Email" error={errors.email?.message} required>
                    <Input type="email" placeholder="contact@acme.com" {...register('email')} />
                  </FormField>
                  <FormField label="Phone">
                    <Input placeholder="+1 555 000 0000" {...register('phone')} />
                  </FormField>
                  <FormField label="WhatsApp Number">
                    <Input placeholder="+1 555 000 0000" {...register('whatsappNumber')} />
                  </FormField>
                  <FormField label="Address" className="sm:col-span-2">
                    <Input placeholder="123 Main St, City" {...register('address')} />
                  </FormField>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <FormField label="Industry">
                    <Input placeholder="SaaS, Retail, Healthcare..." {...register('industry')} />
                  </FormField>
                  <FormField label="Website">
                    <Input placeholder="https://acme.com" {...register('website')} />
                  </FormField>
                  <FormField label="Product Information">
                    <Textarea rows={4} placeholder="Describe the products or services..." {...register('productInformation')} />
                  </FormField>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <FormField label="Campaign Information">
                    <Textarea rows={4} placeholder="Goals, channels, target audience..." {...register('campaignInformation')} />
                  </FormField>
                  <FormField label="Requirements">
                    <Textarea rows={3} placeholder="Specific deliverables or constraints..." {...register('requirements')} />
                  </FormField>
                  <FormField label="Notes">
                    <Textarea rows={2} placeholder="Anything else..." {...register('notes')} />
                  </FormField>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Review your submission</p>
                  <ReviewRow label="Company" value={v.companyName} />
                  <ReviewRow label="Contact" value={v.clientName} />
                  <ReviewRow label="Email" value={v.email} />
                  <ReviewRow label="Industry" value={v.industry} />
                  <ReviewRow label="Website" value={v.website} />
                  <ReviewRow label="Product" value={v.productInformation} />
                  <ReviewRow label="Campaign" value={v.campaignInformation} />
                  <ReviewRow label="Requirements" value={v.requirements} />
                  <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                    Submitting will move this client to <strong>Pending Admin Approval</strong>.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {(savingDraft) && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving draft…</span>}
              {step < STEPS.length - 1 ? (
                <Button onClick={next} disabled={savingDraft}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit(onSubmit)} loading={submitClient.isPending}>
                  <Send className="h-4 w-4" /> Submit for Approval
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-foreground">{value || '—'}</span>
    </div>
  )
}
