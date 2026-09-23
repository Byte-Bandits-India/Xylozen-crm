import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Dropdown,
  Tag,
  message,
  type TableColumnsType,
  type MenuProps,
} from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/context/AuthContext'
import { roleService } from '@/services/roleService'
import type { FunctionalRole } from '@/types'
import type { AxiosError } from 'axios'

export default function RoleManagement() {
  const { isAdmin } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 1. Fetch Functional Roles
  const { data: functionalRoles = [], isLoading } = useQuery<FunctionalRole[]>({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  // 2. Create Functional Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async (values: { name: string; description?: string }) => {
      return await roleService.createFunctionalRole(values)
    },
    onSuccess: (newRole) => {
      message.success(`Functional role "${newRole.name}" created successfully!`)
      form.resetFields()
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['functional-roles'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to create functional role')
    },
  })

  // 3. Delete Functional Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (publicId: string) => {
      return await roleService.deleteFunctionalRole(publicId)
    },
    onSuccess: () => {
      message.success('Functional role deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['functional-roles'] })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to delete functional role')
    },
  })

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const columns: TableColumnsType<FunctionalRole> = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="font-medium text-gray-900">{name}</div>
      ),
    },
    {
      title: 'Tag Preview',
      dataIndex: 'name',
      key: 'tag',
      render: (name: string) => <Tag>{name}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc?: string) => (
        <span className="text-gray-500 text-sm">{desc || '—'}</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 80,
      render: (_: unknown, record: FunctionalRole) => {
        const items: MenuProps['items'] = [
          {
            key: 'delete',
            label: 'Delete',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: 'Delete Functional Role',
                content: `Are you sure you want to delete "${record.name}"?`,
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () =>
                  deleteRoleMutation.mutate(record.publicId || record.id || record.name),
              })
            },
          },
        ]

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<SettingOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen w-full">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Functional Roles
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Manage functional roles and department specializations for team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-medium"
          >
            Add Role
          </Button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
        <Table
          dataSource={functionalRoles}
          columns={columns}
          rowKey={(r) => r.publicId || r.id || r.name}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Create Functional Role Modal */}
      <Modal
        title="Add Functional Role"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        confirmLoading={createRoleMutation.isPending}
        okText="Create Role"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => createRoleMutation.mutate(values)}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter a role name' }]}
          >
            <Input placeholder="e.g. Developer, Designer, Marketing" />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <Input.TextArea
              placeholder="Brief description of responsibilities"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
