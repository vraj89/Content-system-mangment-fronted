import { z } from 'zod'

export const clientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  clientName: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  productInformation: z.string().optional(),
  campaignInformation: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormValues = z.infer<typeof clientSchema>
