import React, { useState, useEffect } from 'react'
import { Modal, Input } from 'antd'
import { FolderAddOutlined } from '@ant-design/icons'

interface CreateFolderModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
  loading?: boolean
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  open,
  onClose,
  onCreate,
  loading,
}) => {
  const [folderName, setFolderName] = useState('Untitled folder')

  useEffect(() => {
    if (open) {
      setFolderName('Untitled folder')
    }
  }, [open])

  const handleOk = () => {
    if (folderName.trim()) {
      onCreate(folderName.trim())
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <FolderAddOutlined className="text-blue-600" />
          <span>New folder</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Create"
      cancelText="Cancel"
      confirmLoading={loading}
      okButtonProps={{ className: 'bg-blue-600 hover:bg-blue-500 rounded-full px-5 text-xs' }}
      cancelButtonProps={{ className: 'rounded-full text-xs' }}
      destroyOnClose
    >
      <div className="py-3 space-y-2">
        <Input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Folder name"
          autoFocus
          onPressEnter={handleOk}
          className="text-xs py-2 rounded-lg"
        />
      </div>
    </Modal>
  )
}
