import { apiClient } from '@/lib/apiClient'
import type { SalesLead, CreateLeadInput, UpdateLeadInput, LeadStatus } from '@/types'

export const salesService = {
  getLeads: async (params?: { search?: string; status?: string; assignedUserId?: string }): Promise<SalesLead[]> => {
    const res = await apiClient.get('/leads', { params })
    const data = res.data?.data || res.data
    return Array.isArray(data) ? data : []
  },

  createLead: async (input: CreateLeadInput): Promise<SalesLead> => {
    const res = await apiClient.post('/leads', input)
    return res.data?.data || res.data
  },

  updateLead: async (id: string, updates: UpdateLeadInput): Promise<SalesLead> => {
    const res = await apiClient.patch(`/leads/${id}`, updates)
    return res.data?.data || res.data
  },

  updateStatus: async (id: string, status: LeadStatus): Promise<SalesLead> => {
    const res = await apiClient.patch(`/leads/${id}/status`, { status })
    return res.data?.data || res.data
  },

  assignUser: async (id: string, assignedUserId: string | null): Promise<SalesLead> => {
    const res = await apiClient.patch(`/leads/${id}/assign`, { assignedUserId })
    return res.data?.data || res.data
  },

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`)
  },
}
