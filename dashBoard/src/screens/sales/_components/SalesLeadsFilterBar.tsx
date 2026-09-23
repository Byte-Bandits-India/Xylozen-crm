import React from 'react'
import { Input, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

export interface UserOption {
  id: string
  name: string
  email?: string
}

export interface SalesLeadsFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedUserFilter: string
  onUserFilterChange: (value: string) => void
  userOptions: UserOption[]
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  filteredCount: number
}

export const SalesLeadsFilterBar: React.FC<SalesLeadsFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedUserFilter,
  onUserFilterChange,
  userOptions,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
}) => {
  return (
    <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
      {/* Left: Search & Filter Dropdowns in a single line */}
      <div className="flex items-center gap-3 shrink-0">
        <Input
          placeholder="Search company, client, email..."
          prefix={<SearchOutlined className="text-slate-400 text-xs mr-1" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="w-64 text-xs"
          size="small"
        />

        <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
          <span>Sales Rep:</span>
          <Select
            size="small"
            value={selectedUserFilter}
            onChange={onUserFilterChange}
            className="w-40 text-xs"
            popupMatchSelectWidth={false}
            options={[
              { label: 'All Sales Reps', value: 'ALL' },
              { label: 'Unassigned', value: 'UNASSIGNED' },
              ...userOptions.map((u) => ({
                label: u.name,
                value: u.id,
              })),
            ]}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
          <span>Status:</span>
          <Select
            size="small"
            value={statusFilter}
            onChange={onStatusFilterChange}
            className="w-32 text-xs"
            popupMatchSelectWidth={false}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Enquired', value: 'enquired' },
              { label: 'Converted', value: 'converted' },
              { label: 'Not-Converted', value: 'not-converted' },
            ]}
          />
        </div>
      </div>

      {/* Right: Showing count */}
      <div className="text-xs text-slate-500 shrink-0">
        Showing {filteredCount} leads
      </div>
    </div>
  )
}
