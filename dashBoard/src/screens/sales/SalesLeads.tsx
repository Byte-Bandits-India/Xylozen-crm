import { useState, useMemo, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Popconfirm,
  Tooltip,
  message,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { salesService } from '@/services/salesService'
import { workService } from '@/services/workService'
import { queryClient } from '@/lib/queryClient'
import type { SalesLead, LeadStatus, CreateLeadInput, UpdateLeadInput } from '@/types'
import { SalesLeadsHeader } from './_components/SalesLeadsHeader'
import { SalesLeadsFilterBar } from './_components/SalesLeadsFilterBar'

export const INDUSTRY_OPTIONS = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'E-Commerce',
  'Logistics',
  'Real Estate',
  'Media',
  'Education',
  'Consulting',
  'Other',
]

export const SERVICE_OPTIONS = [
  'Web Development',
  'Mobile App',
  'Cloud / DevOps',
  'UI/UX Design',
  'Custom CRM/ERP',
  'AI / Automation',
  'Maintenance',
  'Consulting',
]

const EMPTY_NEW_ROW: CreateLeadInput = {
  companyName: '',
  industry: 'Technology',
  clientName: '',
  email: '',
  phone: '',
  service: 'Web Development',
  description: '',
  status: 'enquired',
  assignedUserId: null,
}

export default function SalesLeads() {
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [newRowData, setNewRowData] = useState<CreateLeadInput>(EMPTY_NEW_ROW)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<SalesLead>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    try {
      localStorage.removeItem('bytebandits_sales_leads_v1')
    } catch {
      // Ignore
    }
  }, [])

  // 1. Fetch Sales Leads
  const { data: leads = [], isLoading } = useQuery<SalesLead[]>({
    queryKey: ['sales-leads'],
    queryFn: () => salesService.getLeads(),
  })

  // 2. Fetch Team Members
  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: workService.getAssignableUsers,
  })

  const userOptions = useMemo(() => {
    return assignableUsers.map((u) => ({
      id: u.id,
      name: u.name || 'User',
      email: u.email || '',
    }))
  }, [assignableUsers])

  // 3. Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateLeadInput) => salesService.createLead(input),
    onSuccess: () => {
      message.success('Lead created successfully')
      setIsAddingRow(false)
      setNewRowData(EMPTY_NEW_ROW)
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] })
    },
    onError: () => {
      message.error('Failed to create lead')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLeadInput }) =>
      salesService.updateLead(id, updates),
    onSuccess: () => {
      message.success('Lead updated successfully')
      setEditingRowId(null)
      setEditingValues({})
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] })
    },
    onError: () => {
      message.error('Failed to update lead')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesService.deleteLead(id),
    onSuccess: () => {
      message.success('Lead deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] })
    },
    onError: () => {
      message.error('Failed to delete lead')
    },
  })

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      salesService.updateStatus(id, status),
    onSuccess: () => {
      message.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] })
    },
    onError: () => {
      message.error('Failed to update status')
    },
  })

  const quickAssignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string | null }) =>
      salesService.assignUser(id, userId),
    onSuccess: () => {
      message.success('User assignment updated')
      queryClient.invalidateQueries({ queryKey: ['sales-leads'] })
    },
    onError: () => {
      message.error('Failed to assign user')
    },
  })

  // Start Inline Editing an existing row
  const startInlineEdit = (record: SalesLead) => {
    setEditingRowId(record.id)
    setEditingValues({
      companyName: record.companyName,
      industry: record.industry,
      email: record.email,
      phone: record.phone,
      clientName: record.clientName,
      service: record.service,
      description: record.description,
      status: record.status,
      assignedUserId: record.assignedUserId,
    })
  }

  const cancelInlineEdit = () => {
    setEditingRowId(null)
    setEditingValues({})
  }

  const saveInlineEdit = (id: string) => {
    const email = editingValues.email?.trim() || ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      message.error('Please enter a valid email address')
      return
    }

    updateMutation.mutate({
      id,
      updates: {
        companyName: editingValues.companyName?.trim() || '',
        industry: editingValues.industry || 'Technology',
        email,
        phone: editingValues.phone?.trim() || '',
        clientName: editingValues.clientName?.trim() || '',
        service: editingValues.service || 'Web Development',
        description: editingValues.description?.trim() || '',
        status: (editingValues.status as LeadStatus) || 'enquired',
        assignedUserId: editingValues.assignedUserId,
      },
    })
  }

  // Handle New Row creation
  const handleAddNewRow = () => {
    setIsAddingRow(true)
    setNewRowData(EMPTY_NEW_ROW)
  }

  const handleCancelNewRow = () => {
    setIsAddingRow(false)
    setNewRowData(EMPTY_NEW_ROW)
  }

  const handleSaveNewRow = () => {
    const email = newRowData.email?.trim() || ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      message.error('Please enter a valid email address')
      return
    }

    createMutation.mutate({
      ...newRowData,
      companyName: newRowData.companyName?.trim() || '',
      clientName: newRowData.clientName?.trim() || '',
      email,
      phone: newRowData.phone?.trim() || '',
      description: newRowData.description?.trim() || '',
    })
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      message.warning('No leads to export')
      return
    }

    const headers = ['Company Name', 'Industry', 'Email', 'Phone', 'Client Name', 'Service', 'Description', 'Status']
    const rows = filteredLeads.map((item: SalesLead) => [
      `"${item.companyName.replace(/"/g, '""')}"`,
      `"${item.industry.replace(/"/g, '""')}"`,
      `"${item.email.replace(/"/g, '""')}"`,
      `"${item.phone.replace(/"/g, '""')}"`,
      `"${item.clientName.replace(/"/g, '""')}"`,
      `"${item.service.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.status}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((e: string[]) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'sales_leads.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filtered Leads
  const filteredLeads = useMemo<SalesLead[]>(() => {
    return (leads || []).filter((lead: SalesLead) => {
      if (selectedUserFilter !== 'ALL') {
        if (selectedUserFilter === 'UNASSIGNED') {
          if (lead.assignedUserId) return false
        } else if (lead.assignedUserId !== selectedUserFilter) {
          return false
        }
      }

      if (statusFilter !== 'ALL' && lead.status !== statusFilter) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          lead.companyName.toLowerCase().includes(q) ||
          lead.clientName.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.service.toLowerCase().includes(q) ||
          lead.industry.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [leads, selectedUserFilter, statusFilter, searchQuery])

  // Combined Table Data: includes temporary new row at index 0 if adding
  const tableData = useMemo(() => {
    if (!isAddingRow) return filteredLeads

    const tempNewRow: SalesLead = {
      id: '__NEW_ROW__',
      publicId: '__NEW_ROW__',
      companyName: newRowData.companyName,
      industry: newRowData.industry,
      email: newRowData.email,
      phone: newRowData.phone,
      clientName: newRowData.clientName,
      service: newRowData.service,
      description: newRowData.description,
      status: newRowData.status,
      assignedUserId: newRowData.assignedUserId,
      assignedUser: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return [tempNewRow, ...filteredLeads]
  }, [filteredLeads, isAddingRow, newRowData])

  // Table Columns with exact percentages that sum to 100% (compact, NO horizontal scrollbar)
  const columns = [
    {
      title: 'Company Name',
      key: 'companyName',
      width: '13%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Input
              size="small"
              placeholder="Company name"
              value={newRowData.companyName}
              onChange={(e) => setNewRowData((prev) => ({ ...prev, companyName: e.target.value }))}
              autoFocus
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Input
              size="small"
              value={editingValues.companyName}
              onChange={(e) => setEditingValues((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          )
        }
        return (
          <Tooltip title={record.companyName}>
            <span className="font-semibold text-slate-800 text-xs truncate block">{record.companyName || '-'}</span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Industry',
      key: 'industry',
      width: '9%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Select
              size="small"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={newRowData.industry}
              onChange={(val) => setNewRowData((prev) => ({ ...prev, industry: val }))}
              options={INDUSTRY_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Select
              size="small"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={editingValues.industry}
              onChange={(val) => setEditingValues((prev) => ({ ...prev, industry: val }))}
              options={INDUSTRY_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          )
        }
        return (
          <Tooltip title={record.industry}>
            <span className="text-xs text-slate-600 truncate block">{record.industry || '-'}</span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Email Address',
      key: 'email',
      width: '14%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Input
              size="small"
              placeholder="Email address"
              value={newRowData.email}
              onChange={(e) => setNewRowData((prev) => ({ ...prev, email: e.target.value }))}
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Input
              size="small"
              value={editingValues.email}
              onChange={(e) => setEditingValues((prev) => ({ ...prev, email: e.target.value }))}
            />
          )
        }
        return (
          <Tooltip title={record.email}>
            <a
              href={record.email ? `mailto:${record.email}` : undefined}
              className="text-xs text-blue-600 hover:underline truncate block whitespace-nowrap"
            >
              {record.email || '-'}
            </a>
          </Tooltip>
        )
      },
    },
    {
      title: 'Phone Number',
      key: 'phone',
      width: '10%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Input
              size="small"
              placeholder="10 digits"
              value={newRowData.phone}
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10)
                setNewRowData((prev) => ({ ...prev, phone: cleaned }))
              }}
              className="text-xs font-mono"
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Input
              size="small"
              placeholder="10 digits"
              value={editingValues.phone ?? ''}
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10)
                setEditingValues((prev) => ({ ...prev, phone: cleaned }))
              }}
              className="text-xs font-mono"
            />
          )
        }
        return (
          <a
            href={record.phone ? `tel:${record.phone}` : undefined}
            className="text-xs text-slate-700 hover:underline whitespace-nowrap block truncate font-mono"
            title={record.phone}
          >
            {record.phone || '-'}
          </a>
        )
      },
    },
    {
      title: 'Client Name',
      key: 'clientName',
      width: '10%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Input
              size="small"
              placeholder="Client name"
              value={newRowData.clientName}
              onChange={(e) => setNewRowData((prev) => ({ ...prev, clientName: e.target.value }))}
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Input
              size="small"
              value={editingValues.clientName}
              onChange={(e) => setEditingValues((prev) => ({ ...prev, clientName: e.target.value }))}
            />
          )
        }
        return (
          <Tooltip title={record.clientName}>
            <span className="text-xs text-slate-800 whitespace-nowrap truncate block">{record.clientName || '-'}</span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Service',
      key: 'service',
      width: '10%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Select
              size="small"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={newRowData.service}
              onChange={(val) => setNewRowData((prev) => ({ ...prev, service: val }))}
              options={SERVICE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Select
              size="small"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={editingValues.service}
              onChange={(val) => setEditingValues((prev) => ({ ...prev, service: val }))}
              options={SERVICE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          )
        }
        return (
          <Tooltip title={record.service}>
            <span className="text-xs text-slate-700 truncate block">{record.service || '-'}</span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Description',
      key: 'description',
      width: '14%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Input.TextArea
              size="small"
              rows={1}
              autoSize={{ minRows: 1, maxRows: 3 }}
              placeholder="Description..."
              value={newRowData.description}
              onChange={(e) => setNewRowData((prev) => ({ ...prev, description: e.target.value }))}
              className="text-xs leading-tight"
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Input.TextArea
              size="small"
              rows={1}
              autoSize={{ minRows: 1, maxRows: 3 }}
              placeholder="Description..."
              value={editingValues.description ?? ''}
              onChange={(e) => setEditingValues((prev) => ({ ...prev, description: e.target.value }))}
              className="text-xs leading-tight"
            />
          )
        }
        return (
          <Tooltip
            title={
              record.description ? (
                <div className="whitespace-pre-wrap max-w-xs text-xs">{record.description}</div>
              ) : undefined
            }
          >
            <span className="text-xs text-slate-500 truncate block cursor-pointer">
              {record.description || '-'}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: '10%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Select
              size="small"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={newRowData.status}
              onChange={(val) => setNewRowData((prev) => ({ ...prev, status: val }))}
              options={[
                { label: 'Enquired', value: 'enquired' },
                { label: 'Converted', value: 'converted' },
                { label: 'Not-Converted', value: 'not-converted' },
              ]}
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Select
              size="small"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={editingValues.status}
              onChange={(val) => setEditingValues((prev) => ({ ...prev, status: val }))}
              options={[
                { label: 'Enquired', value: 'enquired' },
                { label: 'Converted', value: 'converted' },
                { label: 'Not-Converted', value: 'not-converted' },
              ]}
            />
          )
        }

        return (
          <Select
            size="small"
            variant="borderless"
            value={record.status}
            onChange={(status) => quickStatusMutation.mutate({ id: record.id, status })}
            className="w-full text-xs p-0"
            popupMatchSelectWidth={false}
            options={[
              {
                label: <Tag color="blue" className="mr-0 text-[11px] font-medium">Enquired</Tag>,
                value: 'enquired',
              },
              {
                label: <Tag color="green" className="mr-0 text-[11px] font-medium">Converted</Tag>,
                value: 'converted',
              },
              {
                label: <Tag color="default" className="mr-0 text-[11px] font-medium">Not-Converted</Tag>,
                value: 'not-converted',
              },
            ]}
          />
        )
      },
    },
    {
      title: 'Assigned',
      key: 'assignedUser',
      width: '12%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <Select
              size="small"
              allowClear
              placeholder="Unassigned"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={newRowData.assignedUserId || undefined}
              onChange={(val) => setNewRowData((prev) => ({ ...prev, assignedUserId: val || null }))}
              options={userOptions.map((u) => ({
                label: u.name,
                value: u.id,
              }))}
            />
          )
        }
        if (editingRowId === record.id) {
          return (
            <Select
              size="small"
              allowClear
              placeholder="Unassigned"
              className="w-full text-xs"
              popupMatchSelectWidth={false}
              value={editingValues.assignedUserId || undefined}
              onChange={(val) => setEditingValues((prev) => ({ ...prev, assignedUserId: val || null }))}
              options={userOptions.map((u) => ({
                label: u.name,
                value: u.id,
              }))}
            />
          )
        }

        return (
          <Select
            size="small"
            variant="borderless"
            allowClear
            placeholder="Unassigned"
            className="w-full text-xs truncate"
            popupMatchSelectWidth={false}
            value={record.assignedUserId || undefined}
            onChange={(val) => quickAssignMutation.mutate({ id: record.id, userId: val || null })}
            options={userOptions.map((u) => ({
              label: u.name,
              value: u.id,
            }))}
          />
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: '8%',
      render: (_: any, record: SalesLead) => {
        if (record.id === '__NEW_ROW__') {
          return (
            <div className="flex items-center gap-1 justify-center">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleSaveNewRow}
                loading={createMutation.isPending}
                title="Save new lead"
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancelNewRow}
                title="Cancel"
              />
            </div>
          )
        }

        if (editingRowId === record.id) {
          return (
            <div className="flex items-center gap-1 justify-center">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => saveInlineEdit(record.id)}
                loading={updateMutation.isPending}
                title="Save changes"
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={cancelInlineEdit}
                title="Cancel"
              />
            </div>
          )
        }

        return (
          <div className="flex items-center gap-1 justify-center">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startInlineEdit(record)}
              title="Edit in table"
            />
            <Popconfirm
              title="Delete lead?"
              description="Are you sure you want to delete this lead?"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, size: 'small' }}
              cancelButtonProps={{ size: 'small' }}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                title="Delete lead"
              />
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-4 sm:p-6 bg-slate-50 w-full max-w-full overflow-x-hidden space-y-4">
      {/* 1. Top Header Row: Heading on left, Export & Add Lead on right */}
      <SalesLeadsHeader
        onExportCSV={handleExportCSV}
        onAddNewRow={handleAddNewRow}
        isAddingRow={isAddingRow}
      />

      {/* 2. Filters & Search Bar in a clean, strictly single line */}
      <SalesLeadsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedUserFilter={selectedUserFilter}
        onUserFilterChange={setSelectedUserFilter}
        userOptions={userOptions}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filteredCount={filteredLeads.length}
      />

      {/* Main Table - 100% width, compact size, NO scrollbar */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden w-full max-w-full">
        <Table
          dataSource={tableData}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          tableLayout="fixed"
          rowClassName={(record) => {
            if (record.id === '__NEW_ROW__') return 'bg-blue-50/50'
            if (editingRowId === record.id) return 'bg-amber-50/30'
            return ''
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} leads`,
          }}
          size="small"
          className="w-full sales-leads-table"
        />
      </div>
    </div>
  )
}
