export interface ClientDocument {
  name: string
  url: string
  uploadedBy?: string
}

export type ClientStatus = 'DRAFT' | 'PENDING_ADMIN_APPROVAL' | 'REJECTED' | 'APPROVED'

export interface Client {
  _id: string
  companyName: string
  clientName?: string
  email: string
  phone?: string
  whatsappNumber?: string
  address?: string
  industry?: string
  website?: string
  productInformation?: string
  campaignInformation?: string
  requirements?: string
  notes?: string
  documents?: ClientDocument[]
  status: ClientStatus
  clientUserId?: string
  projectId?: string
  createdBy?: string
  submittedBy?: string
  submittedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientBody {
  companyName: string
  clientName?: string
  email: string
  phone?: string
  whatsappNumber?: string
  address?: string
  industry?: string
  website?: string
  productInformation?: string
  campaignInformation?: string
  requirements?: string
  notes?: string
}

export interface ClientListResponse {
  clients: Client[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}
