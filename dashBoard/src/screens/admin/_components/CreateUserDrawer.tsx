import { Drawer, Button, Form, Input, Select, Modal, message } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { ALL_PAGES } from '@/lib/permissions'
import { roleService } from '@/services/roleService'
import type { FunctionalRole, UserListItem, UserRole } from '@/types'
import type { AxiosError } from 'axios'

const { Option } = Select

type CreateUserDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  functionalRoles?: FunctionalRole[]
}

export function CreateUserDrawer({
  open,
  onOpenChange,
  functionalRoles: initialFunctionalRoles = [],
}: CreateUserDrawerProps) {
  const [form] = Form.useForm()
  const watchedRole = Form.useWatch('role', form) as UserRole | undefined

  // Fetch functional roles dynamically from API
  const { data: functionalRoles = initialFunctionalRoles } = useQuery<FunctionalRole[]>({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
    initialData: initialFunctionalRoles.length > 0 ? initialFunctionalRoles : undefined,
    enabled: open,
  })

  // Fetch active users to find available managers & admins as supervisors
  const { data: users = [] } = useQuery<UserListItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100')
        return res.data.data || res.data || []
      } catch {
        return []
      }
    },
    enabled: open,
  })

  // Admins and Managers can act as supervisors
  const availableSupervisors = users.filter((u) =>
    u.roles?.some((r) => r === 'MANAGER' || r === 'ADMIN' || r === 'SUPER_ADMIN')
  )

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      return await apiClient.post('/admin/users', values)
    },
    onSuccess: (res) => {
      message.success('User created successfully!')
      if (res.data?.temporaryPassword) {
        Modal.info({
          title: 'User Created',
          content: `The user's temporary password is: \n\n ${res.data.temporaryPassword} \n\n Please share it securely.`,
        })
      }
      onOpenChange(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: AxiosError<{ message?: string; errors?: Record<string, string> }>) => {
      const data = error.response?.data
      let errMsg = data?.message || 'Failed to create user'
      if (data?.errors && typeof data.errors === 'object') {
        const detailList = Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')
        if (detailList) {
          errMsg = `${errMsg} (${detailList})`
        }
      }
      message.error(errMsg)
    },
  })

  const handleFinish = (values: Record<string, unknown>) => {
    const rawPhone = values.phone
      ? String(values.phone).replace(/\D/g, '').slice(0, 10)
      : undefined

    const effectiveAffiliation =
      values.role === 'EXTERNAL_USER'
        ? 'external'
        : values.role === 'INTERNAL_USER'
        ? 'internal'
        : values.affiliation
        ? String(values.affiliation).toLowerCase()
        : 'internal'

    const payload = {
      ...values,
      affiliation: effectiveAffiliation,
      phone: rawPhone && rawPhone.length === 10 ? rawPhone : undefined,
      managerPublicId:
        values.role === 'INTERNAL_USER' || values.role === 'EXTERNAL_USER'
          ? values.managerPublicId || null
          : null,
      accessiblePages:
        values.role === 'MANAGER'
          ? Array.isArray(values.accessiblePages)
            ? (values.accessiblePages as string[]).map((p) => (p.includes(':') ? p : `${p}:edit`))
            : []
          : values.role === 'ADMIN'
          ? ['*']
          : ['status-board:view', 'impact-board:view', 'create-assessment:view', 'image-converter:view'],
    }
    createMutation.mutate(payload)
  }

  return (
    <Drawer
      title="Create New User Account"
      open={open}
      onClose={() => {
        onOpenChange(false)
        form.resetFields()
      }}
      width={540}
      destroyOnClose
      footer={
        <div className="flex items-center justify-end gap-2 py-1">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending}
          >
            Create User Account
          </Button>
        </div>
      }
    >
      <p className="text-xs text-gray-500 mb-5 -mt-2">
        Add a new user with system authority role, manager assignment, and functional role.
      </p>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{
          role: 'INTERNAL_USER',
        }}
        className="space-y-4"
      >
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'First name is required' }]}
            className="mb-0"
          >
            <Input placeholder="Jane" className="w-full" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Last name is required' }]}
            className="mb-0"
          >
            <Input placeholder="Smith" className="w-full" />
          </Form.Item>
        </div>

        {/* Email Address */}
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { type: 'email', message: 'Enter a valid email' },
            { required: true, message: 'Email is required' },
          ]}
          className="mb-0"
        >
          <Input placeholder="jane.smith@example.com" className="w-full" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          {/* System RBAC Access */}
          <Form.Item
            name="role"
            label="System Role"
            rules={[{ required: true, message: 'System role is required' }]}
            className="mb-0"
          >
            <Select className="w-full">
              <Option value="ADMIN">Admin</Option>
              <Option value="MANAGER">Manager</Option>
              <Option value="INTERNAL_USER">Internal User</Option>
              <Option value="EXTERNAL_USER">External User</Option>
            </Select>
          </Form.Item>

          {/* Functional Role Selection from API */}
          <Form.Item
            name="functionalRole"
            label="Functional Role"
            rules={[{ required: watchedRole !== 'ADMIN', message: 'Role is required' }]}
            tooltip="Functional department specialization."
            className="mb-0"
          >
            <Select
              placeholder="Select role"
              className="w-full"
              allowClear
            >
              {functionalRoles.map((r) => (
                <Option key={r.publicId || r.name} value={r.name}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* If MANAGER: Dynamic Page Access multi-select */}
        {watchedRole === 'MANAGER' && (
          <Form.Item
            name="accessiblePages"
            label="Manager Authorized Pages"
            rules={[{ required: true, message: 'Please select at least one page' }]}
            tooltip="Pages this manager is granted access to view."
            className="mb-0"
          >
            <Select
              mode="multiple"
              placeholder="Select authorized pages"
              className="w-full"
              allowClear
              options={ALL_PAGES.map((p) => ({
                label: `${p.title} (${p.category})`,
                value: p.key,
              }))}
            />
          </Form.Item>
        )}

        {/* If INTERNAL or EXTERNAL: Supervising Manager Selection */}
        {(watchedRole === 'INTERNAL_USER' || watchedRole === 'EXTERNAL_USER') && (
          <Form.Item
            name="managerPublicId"
            label="Supervising Manager / Admin"
            tooltip="The manager or admin who oversees this collaborator and their tasks."
            className="mb-0"
          >
            <Select
              placeholder="Select supervising manager or admin"
              allowClear
              className="w-full"
            >
              {availableSupervisors.map((m) => {
                const isAdm = m.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')
                return (
                  <Option key={m.publicId} value={m.publicId}>
                    {m.username || m.email} ({isAdm ? 'Admin' : 'Manager'})
                  </Option>
                )
              })}
            </Select>
          </Form.Item>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="phone"
            label="Phone Number (10 Digits)"
            extra="Optional (10 digits)"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || String(value).trim() === '') {
                    return Promise.resolve()
                  }
                  const digits = String(value).replace(/\D/g, '')
                  if (digits.length !== 10) {
                    return Promise.reject(new Error('Phone number must be exactly 10 digits'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
            className="mb-0"
          >
            <Input
              placeholder="9876543210"
              maxLength={10}
              className="w-full"
              onKeyDown={(e) => {
                const allowedControlKeys = [
                  'Backspace',
                  'Delete',
                  'ArrowLeft',
                  'ArrowRight',
                  'Tab',
                  'Enter',
                ]
                if (
                  allowedControlKeys.includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return
                }
                if (!/^\d$/.test(e.key)) {
                  e.preventDefault()
                }
              }}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10)
                form.setFieldsValue({ phone: cleaned })
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Initial Password"
            extra="Minimum 6 characters"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
            className="mb-0"
          >
            <Input.Password placeholder="SecurePass123!" className="w-full" />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  )
}
