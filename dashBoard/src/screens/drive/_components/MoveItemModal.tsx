import React, { useState } from 'react'
import { Modal, Select } from 'antd'
import { FolderOpenOutlined, FolderFilled } from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'

interface MoveItemModalProps {
  open: boolean
  item: DriveItem | null
  folders: DriveItem[]
  onClose: () => void
  onMove: (id: string, targetFolderId: string, currentParentId?: string) => void
  loading?: boolean
}

export const MoveItemModal: React.FC<MoveItemModalProps> = ({
  open,
  item,
  folders,
  onClose,
  onMove,
  loading,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')

  const availableFolders = folders.filter((f) => f.id !== item?.id)

  const handleOk = () => {
    if (item) {
      onMove(item.id, selectedFolderId, item.parentFolderId || 'root')
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <FolderOpenOutlined className="text-blue-600" />
          <span>Move &quot;{item?.name}&quot;</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Move here"
      cancelText="Cancel"
      confirmLoading={loading}
      okButtonProps={{ className: 'bg-blue-600 hover:bg-blue-500 rounded-full px-5 text-xs' }}
      cancelButtonProps={{ className: 'rounded-full text-xs' }}
      destroyOnClose
    >
      <div className="py-4 space-y-3">
        <label className="text-xs text-slate-600 font-medium block">Select Destination Folder:</label>
        <Select
          value={selectedFolderId}
          onChange={setSelectedFolderId}
          className="w-full text-xs"
          options={[
            {
              value: 'root',
              label: (
                <div className="flex items-center gap-2 text-xs font-medium">
                  <FolderFilled className="text-slate-700" />
                  <span>My Drive (Root)</span>
                </div>
              ),
            },
            ...availableFolders.map((f) => ({
              value: f.id,
              label: (
                <div className="flex items-center gap-2 text-xs">
                  <FolderFilled className="text-blue-600" />
                  <span>{f.name}</span>
                </div>
              ),
            })),
          ]}
        />
      </div>
    </Modal>
  )
}
