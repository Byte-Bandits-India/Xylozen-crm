import { useState, useEffect } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Form,
  Select,
  Tag,
  Spin,
  Table,
  Button,
  Space,
  ConfigProvider,
  message,
  type TableColumnsType,
} from 'antd'
import { TableFilterToolbar } from '@/screens/admin/_components/TableFilterToolbar'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/context/AuthContext'
import { PanelLayout } from '@/components/layout/PanelLayout'
import { FooterActions } from '@/components/layout/FooterActions'
import { roleService } from '@/services/roleService'
import {
  ALL_PAGES,
  type PageDefinition,
  type PagePermissionLevel,
  parseAccessiblePages,
  serializeAccessiblePages,
  getManagerAllowedPermissionLevel,
} from '@/lib/permissions'
import { APP_PAGES } from '@/config/pages.config'
import type { UserListItem, FunctionalRole, UserRole, AppPagePermission } from '@/types'
import type { AxiosError } from 'axios'

const { Option } = Select

const getDefaultManagerPages = (): AppPagePermission[] => {
  return (APP_PAGES || [])
    .filter((p) => p.defaultManagerLevel && p.defaultManagerLevel !== 'none')
    .map((p) => p.key)
}

export default function UserAccess() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { publicId } = useParams<{ publicId?: string }>()
  const [searchParams] = useSearchParams()
  const queryUserId = searchParams.get('userId')

  const [form] = Form.useForm()
  const [pagePermissions, setPagePermissions] = useState<Record<string, PagePermissionLevel>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [levelFilter, setLevelFilter] = useState('ALL')

  // 1. Fetch Users List
  const { data: users = [], isLoading: isUsersLoading } = useQuery<UserListItem[]>({
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

  // 2. Fetch Functional Roles
  const { data: functionalRoles = [] } = useQuery<FunctionalRole[]>({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  // Target User ID: URL param takes precedence, then query param, then first user in list
  const targetUserId = publicId || queryUserId || (users.length > 0 ? users[0].publicId : undefined)

  // 3. Fetch exact user data by ID from backend
  const { data: specificUser, isLoading: isSpecificUserLoading } = useQuery<UserListItem | null>({
    queryKey: ['admin-user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null
      try {
        const res = await apiClient.get(`/admin/users/${targetUserId}`)
        return res.data.data || res.data || null
      } catch (err) {
        console.error('Failed to fetch user by id', err)
        return null
      }
    },
    enabled: isAdmin && !!targetUserId,
  })

  // Resolved user record
  const user = specificUser || users.find((u) => u.publicId === targetUserId)

  const watchedRole = Form.useWatch('role', form) as UserRole | undefined
  const currentRole: UserRole = (user?.roles?.[0] as UserRole) || 'INTERNAL_USER'
  const effectiveRole = watchedRole || currentRole

  const isRoleAdmin = effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN'
  const isRoleManager = effectiveRole === 'MANAGER'
  const isSubordinate = effectiveRole === 'INTERNAL_USER' || effectiveRole === 'EXTERNAL_USER'

  // Watch selected manager in the form or fallback to user's assigned manager
  const watchedManagerId = Form.useWatch('managerPublicId', form) as string | undefined
  const effectiveManagerId = isSubordinate
    ? watchedManagerId !== undefined
      ? watchedManagerId
      : user?.managerPublicId
    : null

  const supervisingManager = users.find((u) => u.publicId === effectiveManagerId)

  // Sync state and form whenever user changes
  useEffect(() => {
    if (user) {
      const primary = (user.roles?.[0] as UserRole) || 'INTERNAL_USER'
      const parsed = parseAccessiblePages(user.accessiblePages)

      let initialPerms = parsed
      if (
        Object.keys(parsed).length === 0 &&
        (user.accessiblePages === null || user.accessiblePages === undefined)
      ) {
        if (primary === 'MANAGER') {
          initialPerms = {}
          for (const key of getDefaultManagerPages()) {
            initialPerms[key] = 'edit'
          }
        } else if (primary === 'INTERNAL_USER' || primary === 'EXTERNAL_USER') {
          initialPerms = {
            'status-board': 'view',
            'impact-board': 'view',
            'create-assessment': 'view',
            'image-converter': 'view',
          }
        }
      }

      setPagePermissions(initialPerms)

      form.resetFields()
      form.setFieldsValue({
        role: primary,
        functionalRole: user.functionalRole || undefined,
        affiliation: user.affiliation
          ? String(user.affiliation).toLowerCase()
          : primary === 'EXTERNAL_USER'
          ? 'external'
          : 'internal',
        managerPublicId: user.managerPublicId || undefined,
      })
    }
  }, [user, form])

  // Mutation: Change Role
  const roleChangeMutation = useMutation({
    mutationFn: async ({ publicId, role }: { publicId: string; role: string }) => {
      await apiClient.patch(`/admin/users/${publicId}/role`, { role })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to update role')
    },
  })

  // Mutation: Change User Details
  const userDetailsMutation = useMutation({
    mutationFn: async (payload: {
      publicId: string
      functionalRole?: string
      affiliation?: string
      managerPublicId?: string | null
      accessiblePages?: string[] | null
    }) => {
      await apiClient.patch(`/admin/users/${payload.publicId}`, {
        functionalRole: payload.functionalRole,
        affiliation: payload.affiliation,
        managerPublicId: payload.managerPublicId,
        accessiblePages: payload.accessiblePages,
      })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to update user details')
    },
  })

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  if (isUsersLoading || (targetUserId && isSpecificUserLoading && !user)) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    )
  }

  // Available supervisors: Managers and Admins
  const availableManagers = users.filter(
    (u) =>
      u.publicId !== user?.publicId &&
      u.roles?.some((r) => r === 'MANAGER' || r === 'ADMIN' || r === 'SUPER_ADMIN')
  )

  const handleSetPermission = (pageKey: string, level: PagePermissionLevel) => {
    setPagePermissions((prev) => ({
      ...prev,
      [pageKey]: level,
    }))
  }

  // Pages available to this user:
  // For Subordinates (INTERNAL_USER / EXTERNAL_USER):
  // Filter out any page where the supervising manager has 'none' access.
  // "for the internal or external users don't shows the Restricted by Manager data"
  const availablePagesForUser = ALL_PAGES.filter((page) => {
    if (isSubordinate) {
      if (!supervisingManager) return false
      const managerMaxLevel = getManagerAllowedPermissionLevel(supervisingManager, page.key)
      return managerMaxLevel !== 'none'
    }
    return true
  })

  const availableCategories = [
    { value: 'ALL', label: 'All Categories' },
    ...Array.from(new Set(availablePagesForUser.map((p) => p.category))).map((c) => ({
      value: c,
      label: c,
    })),
  ]

  const filteredPages = availablePagesForUser.filter((page) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = page.title.toLowerCase().includes(q)
      const matchPath = page.path.toLowerCase().includes(q)
      const matchDesc = page.description.toLowerCase().includes(q)
      const matchCat = page.category.toLowerCase().includes(q)
      if (!matchTitle && !matchPath && !matchDesc && !matchCat) return false
    }

    if (categoryFilter !== 'ALL' && page.category !== categoryFilter) {
      return false
    }

    if (levelFilter !== 'ALL') {
      const currentLevel = isRoleAdmin ? 'edit' : pagePermissions[page.key] || 'none'
      if (currentLevel !== levelFilter) return false
    }

    return true
  })

  const handleBulkSet = (level: PagePermissionLevel) => {
    const updated: Record<string, PagePermissionLevel> = { ...pagePermissions }
    for (const page of filteredPages) {
      if (isSubordinate) {
        if (!supervisingManager) continue
        const maxLevel = getManagerAllowedPermissionLevel(supervisingManager, page.key)
        if (maxLevel === 'none') {
          updated[page.key] = 'none'
        } else if (maxLevel === 'view' && level === 'edit') {
          updated[page.key] = 'view'
        } else {
          updated[page.key] = level
        }
      } else if (isRoleManager) {
        updated[page.key] = level
      }
    }
    setPagePermissions(updated)
  }

  const handleSave = async () => {
    if (!user) return
    try {
      const values = await form.validateFields()
      const newRole = values.role as UserRole

      if (newRole && newRole !== currentRole) {
        await roleChangeMutation.mutateAsync({ publicId: user.publicId, role: newRole })
      }

      // Serialize pagePermissions into string array
      let serializedPages: string[] | null = null
      if (newRole === 'ADMIN') {
        serializedPages = ['*']
      } else {
        const finalMap: Record<string, PagePermissionLevel> = {}
        for (const [key, level] of Object.entries(pagePermissions)) {
          if (level === 'none') continue

          // Validate against supervising manager for subordinate roles
          if (
            (newRole === 'INTERNAL_USER' || newRole === 'EXTERNAL_USER') &&
            supervisingManager
          ) {
            const maxAllowed = getManagerAllowedPermissionLevel(
              supervisingManager,
              key as AppPagePermission
            )
            if (maxAllowed === 'none') continue
            if (maxAllowed === 'view' && level === 'edit') {
              finalMap[key] = 'view'
              continue
            }
          }

          finalMap[key] = level
        }
        serializedPages = serializeAccessiblePages(finalMap)
      }

      const detailsPayload = {
        publicId: user.publicId,
        functionalRole: newRole === 'ADMIN' ? null : (values.functionalRole || null),
        affiliation: newRole === 'EXTERNAL_USER' ? 'external' : 'internal',
        managerPublicId: isSubordinate ? values.managerPublicId || null : null,
        accessiblePages: serializedPages,
      }

      await userDetailsMutation.mutateAsync(detailsPayload)

      message.success(`Permissions and role saved for ${user.username || user.email}!`)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', user.publicId] })
    } catch {
      // Form validation error
    }
  }

  const columns: TableColumnsType<PageDefinition> = [
    {
      title: 'Module / Page',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <span className="font-medium text-gray-900">{title}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: 'Route',
      dataIndex: 'path',
      key: 'path',
      render: (path: string) => <span className="text-xs text-gray-500 font-mono">{path}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <span className="text-xs text-gray-500">{desc}</span>,
    },
    {
      title: 'Access Level',
      key: 'access',
      width: 220,
      render: (_, record) => {
        if (isRoleAdmin) {
          return <Tag>Full Access (Admin)</Tag>
        }

        if (isSubordinate) {
          if (!supervisingManager) {
            return (
              <span className="text-xs text-gray-400 italic">
                Assign manager to configure
              </span>
            )
          }

          const managerMaxLevel = getManagerAllowedPermissionLevel(
            supervisingManager,
            record.key
          )

          const currentLevel = pagePermissions[record.key] || 'none'

          return (
            <Select
              size="small"
              value={currentLevel}
              onChange={(val) => handleSetPermission(record.key, val)}
              className="w-36"
              options={[
                { value: 'none', label: 'No Access' },
                { value: 'view', label: 'View Only' },
                {
                  value: 'edit',
                  label: 'Edit Access',
                  disabled: managerMaxLevel === 'view',
                },
              ]}
            />
          )
        }

        // For Manager users
        const currentLevel = pagePermissions[record.key] || 'none'
        return (
          <Select
            size="small"
            value={currentLevel}
            onChange={(val) => handleSetPermission(record.key, val)}
            className="w-36"
            options={[
              { value: 'none', label: 'No Access' },
              { value: 'view', label: 'View Only' },
              { value: 'edit', label: 'Edit Access' },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className="p-6">
      {user ? (
        <PanelLayout title={`Permissions: ${user.username || user.email}`}>
          {/* User Selector Dropdown inside PanelLayout */}
          <div className="mb-6 pb-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Select User:
            </span>
            <Select
              showSearch
              placeholder="Select a user to configure..."
              value={user?.publicId}
              onChange={(val) => {
                navigate(`/admin/permissions/${val}`)
              }}
              className="w-full sm:w-80"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((u) => ({
                value: u.publicId,
                label: `${u.username || u.email} (${u.roles?.[0] || 'User'})`,
              }))}
            />
          </div>

          <Form
            layout="vertical"
            form={form}
            initialValues={{
              role: currentRole,
              functionalRole: user.functionalRole || undefined,
              affiliation: user.affiliation ? String(user.affiliation).toLowerCase() : 'internal',
              managerPublicId: user.managerPublicId || undefined,
            }}
          >
            {/* Form Fields: Role, Manager, Functional Role, Affiliation */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${
                isRoleAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
              } gap-4 mb-6`}
            >
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select
                  onChange={(val) => {
                    const r = val as UserRole
                    form.setFieldsValue({ role: r })
                    if (r === 'EXTERNAL_USER') {
                      form.setFieldsValue({ affiliation: 'external' })
                    } else {
                      form.setFieldsValue({ affiliation: 'internal' })
                    }
                  }}
                >
                  <Option value="ADMIN">Admin</Option>
                  <Option value="MANAGER">Manager</Option>
                  <Option value="INTERNAL_USER">Internal User</Option>
                  <Option value="EXTERNAL_USER">External User</Option>
                </Select>
              </Form.Item>

              {isSubordinate ? (
                <Form.Item
                  name="managerPublicId"
                  label="Supervising Manager"
                  rules={[{ required: true, message: 'Please select a manager' }]}
                >
                  <Select placeholder="Select manager" allowClear>
                    {availableManagers.map((m) => {
                      const isAdm = m.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')
                      return (
                        <Option key={m.publicId} value={m.publicId}>
                          {m.username || m.email} ({isAdm ? 'Admin' : 'Manager'})
                        </Option>
                      )
                    })}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item label="Supervising Manager">
                  <Select
                    disabled
                    value={isRoleAdmin ? 'Top Level (Admin)' : 'Admin / Executive'}
                  />
                </Form.Item>
              )}

              {!isRoleAdmin && (
                <Form.Item name="functionalRole" label="Functional Role">
                  <Select
                    placeholder="Select functional role"
                    allowClear
                  >
                    {functionalRoles.map((r) => (
                      <Option key={r.publicId || r.name} value={r.name}>
                        {r.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item name="affiliation" label="Affiliation">
                <Select
                  disabled
                  placeholder="Select affiliation"
                >
                  <Option value="internal">Internal</Option>
                  <Option value="external">External</Option>
                </Select>
              </Form.Item>
            </div>

            {/* Table Header & Quick Action Buttons */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-medium text-gray-900">Module & Page Permissions</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isRoleAdmin
                      ? 'Administrators possess full access to all system modules.'
                      : isSubordinate
                      ? supervisingManager
                        ? `Permissions for this collaborator are scoped strictly to supervising manager ${supervisingManager.username || supervisingManager.email}'s authorized access (${availablePagesForUser.length} module${availablePagesForUser.length === 1 ? '' : 's'} available).`
                        : 'Assign a supervising manager above to unlock permission configuration.'
                      : 'Configure view or edit permissions for this manager.'}
                  </p>
                </div>

                {!isRoleAdmin && (
                  <Space size="small">
                    <Button
                      size="small"
                      disabled={isSubordinate && !supervisingManager}
                      onClick={() => handleBulkSet('view')}
                    >
                      All View Only
                    </Button>
                    <Button
                      size="small"
                      disabled={isSubordinate && !supervisingManager}
                      onClick={() => handleBulkSet('edit')}
                    >
                      All Edit
                    </Button>
                    <Button
                      size="small"
                      disabled={isSubordinate && !supervisingManager}
                      onClick={() => handleBulkSet('none')}
                    >
                      Clear All
                    </Button>
                  </Space>
                )}
              </div>

              {isSubordinate && !supervisingManager && (
                <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>Please select a <strong>Supervising Manager</strong> in the form above to view and assign authorized module permissions for this collaborator.</span>
                </div>
              )}

              {/* Table Toolbar Component with layout="vertical" */}
              <TableFilterToolbar
                layout="vertical"
                searchPlaceholder="Search module name, route, description..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                  {
                    key: 'category',
                    label: 'Category',
                    value: categoryFilter,
                    onChange: setCategoryFilter,
                    options: availableCategories,
                    width: 160,
                  },
                  {
                    key: 'level',
                    label: 'Permission Level',
                    value: levelFilter,
                    onChange: setLevelFilter,
                    options: [
                      { value: 'ALL', label: 'All Permissions' },
                      { value: 'edit', label: 'Edit Access' },
                      { value: 'view', label: 'View Only' },
                      { value: 'none', label: 'No Access' },
                    ],
                    width: 160,
                  },
                ]}
                onReset={() => {
                  setSearchQuery('')
                  setCategoryFilter('ALL')
                  setLevelFilter('ALL')
                }}
                hasActiveFilters={Boolean(searchQuery || categoryFilter !== 'ALL' || levelFilter !== 'ALL')}
              />

              {/* Simple Table showing permissions without blue background */}
              <ConfigProvider
                theme={{
                  components: {
                    Table: {
                      rowSelectedBg: 'transparent',
                      rowSelectedHoverBg: '#f9fafb',
                      rowHoverBg: '#f9fafb',
                    },
                  },
                }}
              >
                <Table
                  dataSource={filteredPages}
                  columns={columns}
                  rowKey="key"
                  pagination={false}
                  size="middle"
                  className="[&_.ant-table-row-selected>td]:!bg-transparent [&_.ant-table-row-selected:hover>td]:!bg-gray-50/80 [&_.ant-table-row:hover>td]:!bg-gray-50/80 [&_.ant-table-cell-row-hover]:!bg-gray-50/80"
                />
              </ConfigProvider>
            </div>
          </Form>
        </PanelLayout>
      ) : (
        <PanelLayout title="User Permissions Hub">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Select User:
            </span>
            <Select
              showSearch
              placeholder="Select a user to configure..."
              onChange={(val) => {
                navigate(`/admin/permissions/${val}`)
              }}
              className="w-full sm:w-80"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((u) => ({
                value: u.publicId,
                label: `${u.username || u.email} (${u.roles?.[0] || 'User'})`,
              }))}
            />
          </div>
          <p className="text-sm text-gray-500">
            Please select a user from the dropdown above to view and configure their permissions.
          </p>
        </PanelLayout>
      )}

      {user && (
        <FooterActions
          onSave={handleSave}
          onCancel={() => navigate('/admin/users')}
          isSaving={userDetailsMutation.isPending || roleChangeMutation.isPending}
        />
      )}
    </div>
  )
}
