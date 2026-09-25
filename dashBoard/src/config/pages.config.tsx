import React from 'react'
import {
  Home,
  Users,
  Settings as SettingsIcon,
  Briefcase,
  Kanban,
  CreditCard,
  Wrench,
  TrendingUp,
  HardDrive,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { AppPagePermission, UserRole } from '@/types'

import FinancialDashboard from '@/screens/FinancialDashboard'
import AddExpense from '@/screens/AddExpense'
import UserManagement from '@/screens/admin/UserManagement'
import RoleManagement from '@/screens/admin/RoleManagement'
import UserAccess from '@/screens/admin/UserAccess'
import SiteManagement from '@/screens/admin/SiteManagement'
import ClientsList from '@/screens/clients/ClientsList'
import InvoicesList from '@/screens/invoices/InvoicesList'
import CreateInvoice from '@/screens/invoices/CreateInvoice'
import EditInvoice from '@/screens/invoices/EditInvoice'
import ImageConverter from '@/screens/ImageConverter'
import ContactMessagesList from '@/screens/admin/ContactMessagesList'
import StatusBoard from '@/screens/work/StatusBoard'
import ImpactBoard from '@/screens/work/ImpactBoard'
import CreateAssessment from '@/screens/work/CreateAssessment'
import WorkDetails from '@/screens/work/WorkDetails'
import Settings from '@/screens/settings/Settings'
import SalesLeads from '@/screens/sales/SalesLeads'
import DriveScreen from '@/screens/drive/DriveScreen'

export type PageCategory = 'Core' | 'Work' | 'Financial' | 'Admin'
export type PagePermissionLevel = 'none' | 'view' | 'edit'

export type PageRouteAlias = {
  path: string
  component?: React.ComponentType<any>
  allowedRoles?: UserRole[]
  sidebarTitle?: string
}

export type PageSidebarConfig = {
  group?: string
  title?: string
  url?: string
  icon?: LucideIcon
  isStandalone?: boolean
  isActive?: boolean
  roles?: string[]
  isAdminOnly?: boolean
}

export type PageConfig = {
  key: AppPagePermission
  title: string
  path: string
  category: PageCategory
  description: string
  component: React.ComponentType<any>
  aliases?: PageRouteAlias[]
  allowedRoles?: UserRole[]
  sidebar?: PageSidebarConfig
  defaultManagerLevel?: PagePermissionLevel
}

export const APP_PAGES: PageConfig[] = [
  {
    key: 'dashboard',
    title: 'Financial Dashboard',
    path: '/',
    category: 'Core',
    description: 'Executive financial metrics, spend breakdown, and income summaries',
    component: FinancialDashboard,
    sidebar: {
      title: 'Dashboard',
      icon: Home,
      isStandalone: true,
      isActive: true,
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'status-board',
    title: 'Status Board',
    path: '/work/status-board',
    category: 'Work',
    description: 'Kanban board tracking work assessments through workflow stages',
    component: StatusBoard,
    aliases: [
      { path: '/work/details/:id', component: WorkDetails },
      { path: '/work/assessment/:id', component: WorkDetails },
    ],
    sidebar: {
      group: 'Work & Priorities',
      icon: Kanban,
      title: 'Status Board',
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'impact-board',
    title: 'Impact Board',
    path: '/work/impact-board',
    category: 'Work',
    description: 'Priority calibration matrix for tasks and critical deliverables',
    component: ImpactBoard,
    sidebar: {
      group: 'Work & Priorities',
      icon: Kanban,
      title: 'Impact Board',
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'create-assessment',
    title: 'Create Assessment',
    path: '/work/create',
    category: 'Work',
    description: 'Initiate and assign new work items and assessments',
    component: CreateAssessment,
    aliases: [
      { path: '/work/edit/:id', component: CreateAssessment },
    ],
    sidebar: {
      group: 'Work & Priorities',
      icon: Kanban,
      title: 'Create Assessment',
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'sales-leads',
    title: 'Sales Leads',
    path: '/sales',
    category: 'Core',
    description: 'Inbound prospect pipeline, lead qualification, and sales rep allocation',
    component: SalesLeads,
    aliases: [
      { path: '/sales/leads', component: SalesLeads },
    ],
    sidebar: {
      title: 'Sales Leads',
      icon: TrendingUp,
      isStandalone: true,
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'drive',
    title: 'Drive',
    path: '/drive',
    category: 'Core',
    description: 'Google Drive cloud document hub, folder organization, and direct file storage',
    component: DriveScreen,
    aliases: [
      { path: '/drive/folders/:id', component: DriveScreen },
    ],
    sidebar: {
      title: 'Drive',
      icon: HardDrive,
      isStandalone: true,
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'clients',
    title: 'Clients',
    path: '/clients',
    category: 'Financial',
    description: 'Client directory, active contracts, and company profiles',
    component: ClientsList,
    sidebar: {
      title: 'Clients',
      icon: Briefcase,
      isStandalone: true,
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'invoices',
    title: 'Invoices',
    path: '/invoices',
    category: 'Financial',
    description: 'Billing records, client invoicing, and payment receipts',
    component: InvoicesList,
    aliases: [
      { path: '/invoices/create', component: CreateInvoice },
      { path: '/invoices/edit/:id', component: EditInvoice },
    ],
    sidebar: {
      title: 'Invoices',
      icon: FileText,
      isStandalone: true,
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'fixed-costs',
    title: 'Fixed Costs',
    path: '/add-fixed-cost',
    category: 'Financial',
    description: 'Recurring company expenses and infrastructure costs',
    component: () => <AddExpense type="fixed" />,
    sidebar: {
      group: 'Finances',
      icon: CreditCard,
      title: 'Fixed Costs',
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'operational-costs',
    title: 'Operational Costs',
    path: '/add-operational-cost',
    category: 'Financial',
    description: 'Day-to-day team expenditures and operational outlays',
    component: () => <AddExpense type="operational" />,
    sidebar: {
      group: 'Finances',
      icon: CreditCard,
      title: 'Operational Costs',
    },
    defaultManagerLevel: 'edit',
  },
  {
    key: 'user-management',
    title: 'User Management & Roles',
    path: '/admin/users',
    category: 'Admin',
    description: 'System access control, manager delegation, and team hierarchy',
    component: UserManagement,
    aliases: [
      { path: '/admin/permissions', component: UserAccess, sidebarTitle: 'User Permissions' },
      { path: '/admin/permissions/:publicId', component: UserAccess },
      { path: '/admin/roles', component: RoleManagement, sidebarTitle: 'Functional Roles' },
    ],
    sidebar: {
      group: 'Users',
      icon: Users,
      title: 'User Management',
      isAdminOnly: true,
    },
    defaultManagerLevel: 'none',
  },
  {
    key: 'site-management',
    title: 'Site Credentials',
    path: '/admin/sites',
    category: 'Admin',
    description: 'Secure credential vault for external platform sites',
    component: SiteManagement,
    sidebar: {
      group: 'Tools',
      icon: Wrench,
      title: 'Site Management',
    },
    defaultManagerLevel: 'none',
  },
  {
    key: 'image-converter',
    title: 'Image Converter',
    path: '/image-converter',
    category: 'Core',
    description: 'Image format conversion and asset processing utility',
    component: ImageConverter,
    sidebar: {
      group: 'Tools',
      icon: Wrench,
      title: 'Image Converter',
    },
    defaultManagerLevel: 'view',
  },
  {
    key: 'contact-messages',
    title: 'Contact Messages',
    path: '/admin/contacts',
    category: 'Core',
    description: 'Inbound inquiries and stakeholder submissions',
    component: ContactMessagesList,
    sidebar: {
      group: 'Tools',
      icon: Wrench,
      title: 'Contact Messages',
    },
    defaultManagerLevel: 'none',
  },
  {
    key: 'settings',
    title: 'Settings',
    path: '/settings',
    category: 'Core',
    description: 'User profile, credentials, and notification settings',
    component: Settings,
    aliases: [
      { path: '/settings/profile', component: Settings },
    ],
    sidebar: {
      group: 'Settings',
      icon: SettingsIcon,
      title: 'Profile & Account',
    },
    defaultManagerLevel: 'edit',
  },
]

export const APP_REDIRECTS = [
  { from: '/work-assignment', to: '/work/status-board' },
]
