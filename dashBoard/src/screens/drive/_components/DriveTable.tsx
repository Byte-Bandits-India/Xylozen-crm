import React from 'react'
import { Table, Dropdown, type MenuProps, Tooltip } from 'antd'
import {
  FolderFilled,
  FileTextFilled,
  FileExcelFilled,
  FilePdfFilled,
  FileImageFilled,
  FilePptFilled,
  FileZipFilled,
  FileUnknownFilled,
  MoreOutlined,
  DownloadOutlined,
  EditOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { DriveItem } from '@/types/drive'

interface DriveTableProps {
  items: DriveItem[]
  loading?: boolean
  onOpenFolder: (folder: DriveItem) => void
  onRenameItem: (item: DriveItem) => void
  onMoveItem: (item: DriveItem) => void
  onDeleteItem: (item: DriveItem) => void
  onOpenFileLink: (item: DriveItem) => void
}

export const getFileIcon = (item: DriveItem) => {
  if (item.isFolder || item.mimeType === 'application/vnd.google-apps.folder') {
    return <FolderFilled className="text-lg text-slate-700 shrink-0" />
  }

  const mime = (item.mimeType || '').toLowerCase()
  const name = (item.name || '').toLowerCase()

  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('sheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
    return <FileExcelFilled className="text-lg text-emerald-600 shrink-0" />
  }

  if (mime.includes('document') || mime.includes('word') || mime.includes('text') || name.endsWith('.docx') || name.endsWith('.txt')) {
    return <FileTextFilled className="text-lg text-blue-600 shrink-0" />
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return <FilePdfFilled className="text-lg text-rose-600 shrink-0" />
  }

  if (mime.includes('presentation') || mime.includes('powerpoint') || name.endsWith('.pptx')) {
    return <FilePptFilled className="text-lg text-amber-500 shrink-0" />
  }

  if (mime.includes('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
    return <FileImageFilled className="text-lg text-purple-600 shrink-0" />
  }

  if (mime.includes('zip') || mime.includes('tar') || mime.includes('archive') || name.endsWith('.zip')) {
    return <FileZipFilled className="text-lg text-amber-700 shrink-0" />
  }

  return <FileUnknownFilled className="text-lg text-slate-400 shrink-0" />
}

export const formatDateModified = (dateString: string) => {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    const now = new Date()
    const isCurrentYear = d.getFullYear() === now.getFullYear()
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: isCurrentYear ? undefined : 'numeric',
    })
  } catch {
    return dateString
  }
}

export const formatOwnerName = (owner?: { name?: string; email?: string; isMe?: boolean }) => {
  if (!owner) return 'me'
  const name = owner.name || owner.email || 'me'
  if (name.includes('gserviceaccount.com') || name.includes('dashboard-drive-bot') || owner.isMe) {
    return 'me'
  }
  return name
}

export const DriveTable: React.FC<DriveTableProps> = ({
  items,
  loading,
  onOpenFolder,
  onRenameItem,
  onMoveItem,
  onDeleteItem,
  onOpenFileLink,
}) => {
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

  const columns = [
    {
      title: (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 select-none">
          <span>Name</span>
          <ArrowUpOutlined className="text-[10px] text-blue-600" />
        </div>
      ),
      key: 'name',
      width: '45%',
      render: (_: any, record: DriveItem) => (
        <div
          onClick={() => {
            if (record.isFolder) onOpenFolder(record)
            else onOpenFileLink(record)
          }}
          className="flex items-center gap-2.5 cursor-pointer group py-0.5"
        >
          {getFileIcon(record)}
          <span className="text-xs font-normal text-slate-800 group-hover:text-blue-600 truncate max-w-sm transition-colors">
            {record.name}
          </span>
          {record.shared && (
            <Tooltip title="Shared file">
              <TeamOutlined className="text-[11px] text-slate-400 shrink-0" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-slate-700">Owner</span>,
      key: 'owner',
      width: '18%',
      render: (_: any, record: DriveItem) => {
        const ownerName = formatOwnerName(record.owner)
        const initial = ownerName.charAt(0).toUpperCase() || 'M'
        return (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-medium shrink-0 shadow-2xs">
              {initial}
            </div>
            <span className="truncate">{ownerName}</span>
          </div>
        )
      },
    },
    {
      title: <span className="text-xs font-semibold text-slate-700">Date modified</span>,
      key: 'dateModified',
      width: '18%',
      render: (_: any, record: DriveItem) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {formatDateModified(record.modifiedTime)}
        </span>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-slate-700">File size</span>,
      key: 'fileSize',
      width: '12%',
      render: (_: any, record: DriveItem) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {record.isFolder ? '—' : record.formattedSize || '—'}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: '7%',
      render: (_: any, record: DriveItem) => (
        <div className="flex items-center justify-end">
          <Dropdown menu={{ items: getActionMenu(record) }} trigger={['click']} placement="bottomRight">
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="More actions"
            >
              <MoreOutlined className="text-base" />
            </button>
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        className="drive-files-table"
        onRow={(record) => ({
          onDoubleClick: () => {
            if (record.isFolder) onOpenFolder(record)
            else onOpenFileLink(record)
          },
        })}
        locale={{
          emptyText: (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FolderFilled className="text-4xl text-slate-200 mb-2 block" />
              <span>This folder is empty. Upload files or create folders using "+ New".</span>
            </div>
          ),
        }}
      />
    </div>
  )
}
