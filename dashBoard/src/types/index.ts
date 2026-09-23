// --- Auth ---
export type UserProfile = {
  id: string
  accountPublicId: string
  firstName: string
  lastName: string
  phone?: string
  profileImage?: string
  dateOfBirth?: string
  gender?: string
}

export type User = {
  id: string
  publicId: string
  email: string
  username: string
  status: string
  isEmailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  profile: UserProfile
  roles: string[]
  permissions: string[]
  providers: string[]
  managerPublicId?: string | null
  managerName?: string | null
  accessiblePages?: AppPagePermission[] | null
}

export type LoginPayload = {
  email?: string
  phone?: string
  password: string
  remember: boolean
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
}

// --- Expense ---
export type ExpenseType = 'fixed' | 'operational'

export type Expense = {
  id: string
  publicId: string
  expenseId?: string
  expenseType: string
  type?: ExpenseType
  title: string
  description?: string
  notes?: string
  amount: number
  date?: string
  expenseDate?: string
  dueDate?: string
  category?: string
  status?: string
  recurring?: boolean
  frequency?: string
  vendorName?: string
  paymentMethod?: string
  paidByPublicId?: string
  paidBy?: {
    username?: string
    profile?: {
      firstName?: string
      lastName?: string
      profileImage?: string
    }
  }
  overdueByDays?: number
  createdAt: string
  updatedAt: string
}

// --- Client ---
export type Client = {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: ClientStatus
  createdAt: string
  updatedAt: string
}

export type ClientStatus = 'active' | 'inactive' | 'pending'

// --- Invoice ---
export type Invoice = {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  amount: number
  status: InvoiceStatus
  dueDate: string
  createdAt: string
  updatedAt: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

// --- Contact Message ---
export type ContactMessage = {
  id: string
  publicId?: string
  name: string
  email: string
  phone?: string
  website?: string
  message: string
  source?: string
  status?: MessageStatus
  createdAt: string
  readAt?: string
}

export type MessageStatus = 'new' | 'read' | 'replied' | 'archived'

// --- Page Permissions & Access Control ---
export type AppPagePermission =
  | 'dashboard'
  | 'fixed-costs'
  | 'operational-costs'
  | 'status-board'
  | 'impact-board'
  | 'create-assessment'
  | 'clients'
  | 'invoices'
  | 'image-converter'
  | 'contact-messages'
  | 'user-management'
  | 'site-management'
  | 'sales-leads'
  | 'drive'
  | (string & {})

// --- User Management ---
export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'INTERNAL_USER'
  | 'EXTERNAL_USER'
  | 'SUPER_ADMIN'
  | 'USER'

export type FunctionalRole = {
  id: string
  publicId: string
  name: string
  description?: string
  color?: string
  createdAt?: string
}

export type UserListItem = {
  id: string
  publicId: string
  email: string
  username: string
  status: string
  roles: UserRole[]
  affiliation?: 'internal' | 'external' | 'INTERNAL' | 'EXTERNAL'
  functionalRole?: string
  managerPublicId?: string | null
  managerName?: string | null
  accessiblePages?: AppPagePermission[] | null
  createdAt: string
  lastLoginAt?: string
}

// --- Dashboard Overview ---
export type DashboardOverview = {
  totalExpenses?: number
  totalIncome?: number
  netBalance?: number
  changePercent?: number
  [key: string]: unknown
}

export type Contribution = {
  id: string
  contributorName: string
  amount: number
  date: string
  [key: string]: unknown
}

export type ChartData = {
  expenses?: unknown[]
  breakdown?: SpendBreakdownItem[]
  timeline?: ChartDataPoint[]
  [key: string]: unknown
}

// --- Chart Data ---
export type ChartDataPoint = {
  name: string
  value: number
  date?: string
}

export type SpendBreakdownItem = {
  name: string
  value: number
  share: string
  color: string
}

export type BarChartData = {
  name: string
  value: number
  [key: string]: string | number
}

// --- Site Management ---
export type SiteEntry = {
  id?: string
  _id?: string
  name: string
  userName: string
  url?: string
  password: string
}

// --- Shared / Common ---
export type SelectOption = {
  label: string
  value: string
}

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

export type CardProps = {
  title: string
  children: React.ReactNode
}

export type ApiResponse<T = unknown> = {
  data: T
  message?: string
  status?: number
}

export type ApiError = {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

// --- Work Assignment ---
export type { Priority, WorkStatus, UserRole as WorkUserRole, UserAffiliation, Assignee, Milestone, SubTask, WorkItem } from './work'

// --- Sales ---
export type { LeadStatus, SalesLead, CreateLeadInput, UpdateLeadInput } from './sales'

