import { Button, Popconfirm, type TableColumnsType } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Client } from '@/types'

type GetClientsColumnsParams = {
  canEdit: boolean
  canDelete: boolean
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
}

export function getClientsColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: GetClientsColumnsParams): TableColumnsType<Client> {
  return [
    {
      title: 'Client Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Client) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{text}</span>
          <span className="text-xs text-gray-500">{record.company}</span>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, record: Client) => (
        <div className="flex flex-col">
          <span className="text-sm">{record.email}</span>
          <span className="text-xs text-gray-500">{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`text-sm ${status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Client) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          )}
          {canDelete && (
            <Popconfirm
              title="Delete the client"
              description="Are you sure to delete this client?"
              onConfirm={() => onDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]
}
