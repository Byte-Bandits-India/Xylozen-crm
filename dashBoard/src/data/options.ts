import type { SelectOption } from '@/types'

export const EXPENSE_TYPE_OPTIONS = [
  { label: 'Fixed Cost', value: 'fixed' },
  { label: 'Operational Cost', value: 'operational' },
] satisfies SelectOption[]

export const CLIENT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
] satisfies SelectOption[]

export const INVOICE_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Cancelled', value: 'cancelled' },
] satisfies SelectOption[]

export const MESSAGE_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'read' },
  { label: 'Replied', value: 'replied' },
  { label: 'Archived', value: 'archived' },
] satisfies SelectOption[]

export const USER_ROLE_OPTIONS = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Internal User', value: 'INTERNAL_USER' },
  { label: 'External User', value: 'EXTERNAL_USER' },
] satisfies SelectOption[]

export const USER_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
] satisfies SelectOption[]

export const WORK_PRIORITY_OPTIONS = [
  { label: 'High Priority', value: 'high' },
  { label: 'Medium Priority', value: 'medium' },
  { label: 'Low Priority', value: 'low' },
] satisfies SelectOption[]

export const WORK_PRIORITY_FILTER_OPTIONS = [
  { label: 'All Priorities', value: 'all' },
  ...WORK_PRIORITY_OPTIONS,
] satisfies SelectOption[]

export const WORK_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'To do', value: 'todo' },
  { label: 'Clarifications / Doubts', value: 'clarifications' },
  { label: 'Under analysis', value: 'under_analysis' },
  { label: 'Approval', value: 'approval' },
] satisfies SelectOption[]

export const WORK_STATUS_FILTER_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  ...WORK_STATUS_OPTIONS,
] satisfies SelectOption[]

export const WORK_STATUS_OPTIONS_WITH_DESC = [
  { value: 'new', label: 'New', desc: 'Newly created, pending review' },
  { value: 'todo', label: 'To do', desc: 'Scheduled and ready to start' },
  {
    value: 'clarifications',
    label: 'Clarifications / Doubts',
    desc: 'Requires stakeholder or client feedback',
  },
  {
    value: 'under_analysis',
    label: 'Under analysis',
    desc: 'Work actively in-progress or investigation',
  },
  {
    value: 'approval',
    label: 'Approval',
    desc: 'Final review or sign-off stage',
  },
] as const

export const WORK_AFFILIATION_OPTIONS = [
  { label: 'Internal', value: 'internal' },
  { label: 'External', value: 'external' },
] satisfies SelectOption[]

export const WORK_AFFILIATION_FILTER_OPTIONS = [
  { label: 'All Types', value: 'all' },
  ...WORK_AFFILIATION_OPTIONS,
] satisfies SelectOption[]
