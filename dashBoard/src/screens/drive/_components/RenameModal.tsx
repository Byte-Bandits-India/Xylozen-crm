import React, { useState, useEffect } from 'react'
import { Modal, Input } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'

interface RenameModalProps {
  open: boolean
  item: DriveItem | null
  onClose: () => void
  onRename: (id: string, name: string) => void
  loading?: boolean
}

export const RenameModal: React.FC<RenameModalProps> = ({
  open,
  item,
  onClose,
  onRename,
  loading,
}) => {
  const [name, setName] = useState('')

  useEffect(() => {
    if (item) {
      setName(item.name)
    }
  }, [item])

  const handleOk = () => {
    if (item && name.trim()) {
      onRename(item.id, name.trim())
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <EditOutlined className="text-blue-600" />
          <span>Rename</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="OK"
      cancelText="Cancel"
      confirmLoading={loading}
      okButtonProps={{ className: 'bg-blue-600 hover:bg-blue-500 rounded-full px-5 text-xs' }}
      cancelButtonProps={{ className: 'rounded-full text-xs' }}
      destroyOnClose
    >
      <div className="py-3 space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new name"
          autoFocus
          onPressEnter={handleOk}
          className="text-xs py-2 rounded-lg"
        />
      </div>
    </Modal>
  )
}
