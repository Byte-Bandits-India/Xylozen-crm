import React from 'react'
import { Dropdown, type MenuProps } from 'antd'
import {
  FolderFilled,
  MoreOutlined,
  DownloadOutlined,
  EditOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'
import { getFileIcon, formatDateModified, formatOwnerName } from './DriveTable'

interface DriveGridViewProps {
  items: DriveItem[]
  loading?: boolean
  onOpenFolder: (folder: DriveItem) => void
  onRenameItem: (item: DriveItem) => void
  onMoveItem: (item: DriveItem) => void
  onDeleteItem: (item: DriveItem) => void
  onOpenFileLink: (item: DriveItem) => void
}

export const DriveGridView: React.FC<DriveGridViewProps> = ({
  items,
  loading,
  onOpenFolder,
  onRenameItem,
  onMoveItem,
  onDeleteItem,
  onOpenFileLink,
}) => {
  const folders = items.filter((item) => item.isFolder)
  const files = items.filter((item) => !item.isFolder)

  const getActionMenu = (item: DriveItem): MenuProps['items'] => [
    {
      key: 'open',
      icon: <FolderOpenOutlined />,
      label: item.isFolder ? 'Open folder' : 'Open in Google Drive',
      onClick: () => (item.isFolder ? onOpenFolder(item) : onOpenFileLink(item)),
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: 'Download',
      disabled: item.isFolder,
      onClick: () => {
        if (item.webContentLink || item.webViewLink) {
          window.open(item.webContentLink || item.webViewLink, '_blank')
        }
      },
    },
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: 'Rename',
      onClick: () => onRenameItem(item),
    },
    {
      key: 'move',
      icon: <FolderOpenOutlined />,
      label: 'Organize / Move',
      onClick: () => onMoveItem(item),
    },
    {
      key: 'copy-link',
      icon: <LinkOutlined />,
      label: 'Get shareable link',
      onClick: () => {
        const link = item.webViewLink || window.location.href
        navigator.clipboard.writeText(link)
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
      label: 'Move to trash',
      onClick: () => onDeleteItem(item),
    },
  ]

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-xs">Loading items...</div>
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 py-16 text-center text-slate-400 text-xs">
        <FolderFilled className="text-4xl text-slate-200 mb-2 block" />
        <span>This folder is empty. Upload files or create folders using "+ New".</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => onOpenFolder(folder)}
                className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FolderFilled className="text-xl text-slate-700 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {folder.name}
                  </span>
                </div>

                <Dropdown menu={{ items: getActionMenu(folder) }} trigger={['click']} placement="bottomRight">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <MoreOutlined className="text-sm" />
                  </button>
                </Dropdown>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Files Section */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Files</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {files.map((file) => {
              const ownerName = formatOwnerName(file.owner)
              const initial = ownerName.charAt(0).toUpperCase() || 'M'
              return (
                <div
                  key={file.id}
                  onClick={() => onOpenFileLink(file)}
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer overflow-hidden group flex flex-col justify-between h-40"
                >
                  {/* File Header */}
                  <div className="p-3 pb-2 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(file)}
                      <span className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {file.name}
                      </span>
                    </div>

                    <Dropdown menu={{ items: getActionMenu(file) }} trigger={['click']} placement="bottomRight">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                      >
                        <MoreOutlined className="text-sm" />
                      </button>
                    </Dropdown>
                  </div>

                  {/* Thumbnail / Body preview placeholder */}
                  <div className="flex-1 flex items-center justify-center p-3 text-slate-300 group-hover:text-blue-500 transition-colors bg-white">
                    {getFileIcon(file)}
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-medium shrink-0">
                        {initial}
                      </div>
                      <span>{formatDateModified(file.modifiedTime)}</span>
                    </div>
                    <span>{file.formattedSize || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
