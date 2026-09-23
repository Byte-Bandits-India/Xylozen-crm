import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Table, Button, message } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/context/AuthContext'
import { getUserManagementColumns } from './_components/UserManagementColumns'
import { CreateUserDrawer } from './_components/CreateUserDrawer'
import { TableFilterToolbar } from './_components/TableFilterToolbar'
import type { UserListItem, FunctionalRole, UserRole } from '@/types'
import { roleService } from '@/services/roleService'
import type { AxiosError } from 'axios'

export default function UserManagement() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isDrawerOpen, setIsDrawerOpen] = useState(searchParams.get('create') === 'true')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // 1. Fetch Users Query
  const { data: users = [], isLoading } = useQuery<UserListItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100')
        return res.data.data || res.data || []
      } catch {
        return []
      }
    },
    enabled: isAdmin,
  })

  // 2. Fetch Functional Roles Query
  const { data: functionalRoles = [] } = useQuery<FunctionalRole[]>({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  // 3. Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(`/admin/users/${publicId}`)
    },
    onSuccess: () => {
      message.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to delete user')
    },
  })

  const columns = getUserManagementColumns({
    onDelete: (publicId) => deleteMutation.mutate(publicId),
    onEditAccess: (record) => navigate(`/admin/permissions/${record.publicId}`),
  })

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = (u.username || '').toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }
    if (roleFilter !== 'ALL') {
      if (!u.roles?.includes(roleFilter as UserRole)) return false
    }
    if (statusFilter !== 'ALL') {
      if (u.status !== statusFilter) return false
    }
    return true
  })

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen w-full">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            User Management & Roles
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Manage system access, assign functional roles, and designate internal/external affiliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate('/admin/roles')}
            className="text-xs font-medium"
          >
            Manage Roles
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsDrawerOpen(true)}
            className="text-xs font-medium"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
        {/* Table Toolbar Component */}
        <TableFilterToolbar
          layout="vertical"
          searchPlaceholder="Search user name or email..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={[
            {
              key: 'role',
              label: 'Role',
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { value: 'ALL', label: 'All Roles' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'MANAGER', label: 'Manager' },
                { value: 'INTERNAL_USER', label: 'Internal User' },
                { value: 'EXTERNAL_USER', label: 'External User' },
              ],
              width: 160,
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ],
              width: 140,
            },
          ]}
          onReset={() => {
            setSearchQuery('')
            setRoleFilter('ALL')
            setStatusFilter('ALL')
          }}
          hasActiveFilters={Boolean(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL')}
        />

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="publicId"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <CreateUserDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        functionalRoles={functionalRoles}
      />
    </div>
  )
}
