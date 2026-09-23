export type LeadStatus = 'enquired' | 'converted' | 'not-converted'

export interface SalesLead {
  id: string
  publicId: string
  companyName: string
  industry: string
  email: string
  phone: string
  clientName: string
  service: string
  description: string
  status: LeadStatus
  assignedUserId?: string | null
  assignedUser?: {
    publicId: string
    username: string
    name?: string
    email?: string
  } | null
  createdAt: string
  updatedAt: string
}

export type CreateLeadInput = Omit<SalesLead, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'assignedUser'> & {
  assignedUserId?: string | null
}

export type UpdateLeadInput = Partial<CreateLeadInput>
