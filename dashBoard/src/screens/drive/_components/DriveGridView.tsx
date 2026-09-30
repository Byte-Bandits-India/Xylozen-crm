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
  CheckOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'
import { driveService } from '@/services/driveService'
import { getFileIcon, formatDateModified, formatOwnerName } from './DriveTable'

interface DriveGridViewProps {
  items: DriveItem[]
  loading?: boolean
  selectedItem?: DriveItem | null
  selectedItems?: DriveItem[]
  onSelectItem?: (item: DriveItem | null) => void
  onSelectItems?: (items: DriveItem[]) => void
  onToggleSelectItem?: (item: DriveItem) => void
  onSetContextMenuTarget?: (item: DriveItem | null) => void
  onOpenFolder: (folder: DriveItem) => void
  onRenameItem: (item: DriveItem) => void
  onMoveItem: (item: DriveItem) => void
  onDeleteItem: (item: DriveItem) => void
  onOpenFileLink: (item: DriveItem) => void
}

export const renderCardThumbnail = (file: DriveItem) => {
  const mime = (file.mimeType || '').toLowerCase()
  const name = (file.name || '').toLowerCase()

  const isImage =
    mime.startsWith('image/') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif') ||
    name.endsWith('.svg')

  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf')
  const isSheet =
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('sheet') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.csv')
  const isDoc =
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('text') ||
    name.endsWith('.docx') ||
    name.endsWith('.txt')

  if (isImage) {
    const backendUrl = driveService.getFileContentUrl(file.id)
    return (
      <div className="w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
        <img
          src={backendUrl}
          alt={file.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            if (file.thumbnailLink && e.currentTarget.src !== file.thumbnailLink) {
              e.currentTarget.src = file.thumbnailLink
            } else {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback') as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }
          }}
        />
        <div className="img-fallback hidden w-full h-full items-center justify-center bg-slate-50 text-slate-400">
          {getFileIcon(file)}
        </div>
      </div>
    )
  }

  if (file.thumbnailLink) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-slate-50 flex items-center justify-center p-2">
        <img
          src={file.thumbnailLink}
          alt={file.name}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain rounded shadow-2xs group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.parentElement?.querySelector('.doc-fallback') as HTMLElement
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <div className="doc-fallback hidden w-full h-full items-center justify-center">
          {isPdf ? (
            <div className="w-20 h-24 bg-white rounded-md border border-rose-200/90 shadow-2xs flex flex-col p-2 space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-rose-100">
                <span className="text-[9px] font-bold text-rose-600 tracking-wider">PDF</span>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </div>
              <div className="space-y-1 flex-1 py-1">
                <div className="w-full h-1 bg-slate-200 rounded" />
                <div className="w-4/5 h-1 bg-slate-200 rounded" />
                <div className="w-3/5 h-1 bg-slate-100 rounded" />
                <div className="w-5/6 h-1 bg-slate-100 rounded" />
              </div>
              <div className="w-8 h-1 bg-rose-200 rounded-full" />
            </div>
          ) : (
            getFileIcon(file)
          )}
        </div>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="w-full h-full flex items-center justify-center p-2.5 bg-rose-50/40">
        <div className="w-20 h-24 bg-white rounded-md border border-rose-200/90 shadow-2xs flex flex-col p-2 space-y-1.5 group-hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between pb-1 border-b border-rose-100">
            <span className="text-[9px] font-bold text-rose-600 tracking-wider">PDF</span>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <div className="space-y-1 flex-1 py-1">
            <div className="w-full h-1 bg-slate-200 rounded" />
            <div className="w-4/5 h-1 bg-slate-200 rounded" />
            <div className="w-3/5 h-1 bg-slate-100 rounded" />
            <div className="w-5/6 h-1 bg-slate-100 rounded" />
          </div>
          <div className="w-8 h-1 bg-rose-200 rounded-full" />
        </div>
      </div>
    )
  }

  if (isSheet) {
    return (
      <div className="w-full h-full flex items-center justify-center p-2.5 bg-emerald-50/40">
        <div className="w-20 h-24 bg-white rounded-md border border-emerald-200/90 shadow-2xs flex flex-col p-2 space-y-1.5 group-hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
            <span className="text-[9px] font-bold text-emerald-600 tracking-wider">SHEET</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="grid grid-cols-2 gap-1 flex-1 py-1">
            <div className="h-2 bg-emerald-50 border border-emerald-100 rounded-2xs" />
            <div className="h-2 bg-slate-100 rounded-2xs" />
            <div className="h-2 bg-slate-100 rounded-2xs" />
            <div className="h-2 bg-slate-100 rounded-2xs" />
            <div className="h-2 bg-slate-100 rounded-2xs" />
            <div className="h-2 bg-slate-100 rounded-2xs" />
          </div>
        </div>
      </div>
    )
  }

  if (isDoc) {
    return (
      <div className="w-full h-full flex items-center justify-center p-2.5 bg-blue-50/40">
        <div className="w-20 h-24 bg-white rounded-md border border-blue-200/90 shadow-2xs flex flex-col p-2 space-y-1.5 group-hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between pb-1 border-b border-blue-100">
            <span className="text-[9px] font-bold text-blue-600 tracking-wider">DOC</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
          <div className="space-y-1 flex-1 py-1">
            <div className="w-full h-1 bg-blue-200 rounded" />
            <div className="w-5/6 h-1 bg-slate-200 rounded" />
            <div className="w-4/5 h-1 bg-slate-200 rounded" />
            <div className="w-3/4 h-1 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50/60 text-slate-400 group-hover:text-blue-500 transition-colors">
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-2xl">{getFileIcon(file)}</div>
        <span className="text-[9px] font-semibold uppercase text-slate-400 tracking-wider">
          {name.split('.').pop() || 'FILE'}
        </span>
      </div>
    </div>
  )
}

export const DriveGridView: React.FC<DriveGridViewProps> = ({
  items,
  loading,
  selectedItem,
  selectedItems,
  onSelectItem,
  onToggleSelectItem,
  onSetContextMenuTarget,
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
      icon: item.isFolder ? <FolderOpenOutlined /> : <EyeOutlined />,
      label: item.isFolder ? 'Open folder' : 'Preview file',
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

  const selectedKeys = (selectedItems || []).map((it) => it.id)
  const hasAnyChecked = selectedKeys.length > 0

  return (
    <div className="space-y-6">
      {/* 1. Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Folders</h2>
            <span className="text-[11px] text-slate-400 font-medium">{folders.length} folders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => {
              const isChecked = selectedKeys.includes(folder.id)
              const isFocused = selectedItem?.id === folder.id
              return (
                <div
                  key={folder.id}
                  data-drive-item="true"
                  onClick={() => {
                    onSelectItem?.(folder)
                  }}
                  onDoubleClick={() => onOpenFolder(folder)}
                  onContextMenu={(e) => {
                    e.stopPropagation()
                    onSetContextMenuTarget?.(folder)
                    onSelectItem?.(folder)
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${
                    isChecked
                      ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : isFocused
                      ? 'bg-slate-100/80 border-slate-300'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {/* Checkbox: ONLY clicking here checks/unchecks */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelectItem?.(folder)
                      }}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isChecked
                          ? 'bg-blue-600 text-white'
                          : hasAnyChecked
                          ? 'border border-slate-300 bg-white opacity-60 hover:opacity-100 hover:border-blue-500'
                          : 'border border-slate-300 bg-white opacity-0 group-hover:opacity-100 hover:border-blue-500'
                      }`}
                      title={isChecked ? 'Deselect folder' : 'Select folder'}
                    >
                      {isChecked && <CheckOutlined className="text-[9px]" />}
                    </div>

                    <FolderFilled className={`text-xl shrink-0 ${isChecked ? 'text-blue-600' : 'text-slate-700'}`} />
                    <span className={`text-xs font-medium truncate transition-colors ${isChecked ? 'text-blue-900 font-semibold' : 'text-slate-800 group-hover:text-blue-600'}`}>
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
              )
            })}
          </div>
        </div>
      )}

      {/* 2. Files Section */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Files</h2>
            <span className="text-[11px] text-slate-400 font-medium">{files.length} files</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {files.map((file) => {
              const ownerName = formatOwnerName(file.owner)
              const initial = ownerName.charAt(0).toUpperCase() || 'M'
              const isChecked = selectedKeys.includes(file.id)
              const isFocused = selectedItem?.id === file.id
              return (
                <div
                  key={file.id}
                  data-drive-item="true"
                  onClick={() => {
                    onSelectItem?.(file)
                  }}
                  onDoubleClick={() => onOpenFileLink(file)}
                  onContextMenu={(e) => {
                    e.stopPropagation()
                    onSetContextMenuTarget?.(file)
                    onSelectItem?.(file)
                  }}
                  className={`rounded-xl border transition-all cursor-pointer overflow-hidden group flex flex-col justify-between h-40 select-none ${
                    isChecked
                      ? 'bg-blue-50/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                      : isFocused
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  {/* File Header */}
                  <div className={`p-3 pb-2 flex items-start justify-between gap-2 border-b transition-colors ${
                    isChecked ? 'bg-blue-100/50 border-blue-200' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      {/* Checkbox: ONLY clicking here checks/unchecks */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleSelectItem?.(file)
                        }}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600 text-white'
                            : hasAnyChecked
                            ? 'border border-slate-300 bg-white opacity-60 hover:opacity-100 hover:border-blue-500'
                            : 'border border-slate-300 bg-white opacity-0 group-hover:opacity-100 hover:border-blue-500'
                        }`}
                        title={isChecked ? 'Deselect file' : 'Select file'}
                      >
                        {isChecked && <CheckOutlined className="text-[9px]" />}
                      </div>

                      {getFileIcon(file)}
                      <span className={`text-xs font-medium truncate transition-colors ${
                        isChecked ? 'text-blue-900 font-semibold' : 'text-slate-800 group-hover:text-blue-600'
                      }`}>
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

                  {/* Thumbnail / Body preview */}
                  <div className={`flex-1 overflow-hidden relative ${
                    isChecked ? 'bg-blue-50/20' : 'bg-white'
                  }`}>
                    {renderCardThumbnail(file)}
                  </div>

                  {/* Footer */}
                  <div className={`px-3 py-2 border-t flex items-center justify-between text-[11px] text-slate-500 ${
                    isChecked ? 'bg-blue-100/30 border-blue-200' : 'bg-slate-50/70 border-slate-100'
                  }`}>
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
