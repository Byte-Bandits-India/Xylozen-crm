import React, { useState } from 'react'
import { Modal, Select } from 'antd'
import { FolderOpenOutlined, FolderFilled } from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'

interface MoveItemModalProps {
  open: boolean
  item?: DriveItem | null
  items?: DriveItem[]
  folders: DriveItem[]
  onClose: () => void
  onMove: (id: string, targetFolderId: string, currentParentId?: string) => void
  onMoveMultiple?: (items: DriveItem[], targetFolderId: string) => void
  loading?: boolean
}

export const MoveItemModal: React.FC<MoveItemModalProps> = ({
  open,
  item,
  items,
  folders,
  onClose,
  onMove,
  onMoveMultiple,
  loading,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root')

  // Resolve target items list
  const activeItems: DriveItem[] = items && items.length > 0 ? items : item ? [item] : []
  const activeItemIds = new Set(activeItems.map((it) => it.id))

  // Filter out any destination folder that is currently being moved
  const availableFolders = folders.filter((f) => !activeItemIds.has(f.id))

  const handleOk = () => {
    if (activeItems.length > 1 && onMoveMultiple) {
      onMoveMultiple(activeItems, selectedFolderId)
    } else if (activeItems.length > 0) {
      activeItems.forEach((it) => {
        onMove(it.id, selectedFolderId, it.parentFolderId || 'root')
      })
    }
  }

  const titleText =
    activeItems.length > 1
      ? `Move ${activeItems.length} items`
      : activeItems.length === 1
      ? `Move "${activeItems[0].name}"`
      : 'Move items'

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <FolderOpenOutlined className="text-blue-600" />
          <span>{titleText}</span>
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
