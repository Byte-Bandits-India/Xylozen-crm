import React from 'react'
import { Button, Dropdown, Breadcrumb, type MenuProps } from 'antd'
import {
  PlusOutlined,
  FolderAddOutlined,
  UploadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  InfoCircleOutlined,
  CaretDownOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons'
import type { BreadcrumbItem } from '@/types/drive'

interface DriveHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  onNavigateBreadcrumb: (index: number) => void
  onOpenNewFolder: () => void
  onTriggerFileUpload: () => void
  viewMode: 'list' | 'grid'
  onToggleViewMode: (mode: 'list' | 'grid') => void
  isUploading?: boolean
  uploadProgress?: number | null
}

export const DriveHeader: React.FC<DriveHeaderProps> = ({
  breadcrumbs,
  onNavigateBreadcrumb,
  onOpenNewFolder,
  onTriggerFileUpload,
  viewMode,
  onToggleViewMode,
  isUploading,
  uploadProgress,
}) => {
  const newMenuItems: MenuProps['items'] = [
    {
      key: 'new-folder',
      icon: <FolderAddOutlined className="text-base text-slate-700" />,
      label: <span className="font-medium text-xs">New folder</span>,
      onClick: onOpenNewFolder,
    },
    {
      type: 'divider',
    },
    {
      key: 'file-upload',
      icon: <UploadOutlined className="text-base text-blue-600" />,
      label: <span className="font-medium text-xs">File upload</span>,
      onClick: onTriggerFileUpload,
    },
    {
      key: 'folder-upload',
      icon: <CloudUploadOutlined className="text-base text-blue-600" />,
      label: <span className="font-medium text-xs">Folder upload</span>,
      onClick: onTriggerFileUpload,
    },
  ]

  const currentFolder = breadcrumbs[breadcrumbs.length - 1]

  const driveDropdownItems: MenuProps['items'] = breadcrumbs.map((b, idx) => ({
    key: b.id,
    label: <span className="text-xs">{b.name}</span>,
    onClick: () => onNavigateBreadcrumb(idx),
  }))

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
      {/* Left: Breadcrumbs & Current Folder Dropdown */}
      <div className="flex items-center gap-3">
        <Dropdown menu={{ items: driveDropdownItems }} trigger={['click']}>
          <button className="flex items-center gap-1.5 text-xl font-medium text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer">
            <span>{currentFolder?.name || 'My Drive'}</span>
            <CaretDownOutlined className="text-xs text-slate-500" />
          </button>
        </Dropdown>

        {breadcrumbs.length > 1 && (
          <Breadcrumb
            className="text-xs hidden md:flex items-center"
            items={breadcrumbs.map((b, idx) => ({
              title: (
                <span
                  onClick={() => onNavigateBreadcrumb(idx)}
                  className={`cursor-pointer hover:underline ${
                    idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {b.name}
                </span>
              ),
            }))}
          />
        )}
      </div>

      {/* Right Controls: + New Button, View Switcher & Details */}
      <div className="flex items-center gap-2.5">
        {isUploading && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 animate-pulse">
            <CloudUploadOutlined className="animate-bounce" />
            <span>Uploading... {uploadProgress ? `${uploadProgress}%` : ''}</span>
          </div>
        )}

        <Dropdown menu={{ items: newMenuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            className="bg-blue-600 hover:bg-blue-500 font-medium shadow-sm rounded-full px-4 h-9 flex items-center gap-1.5 text-xs"
          >
            New
          </Button>
        </Dropdown>

        {/* List / Grid View Pill matching Google Drive layout in screenshot */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-xs">
          <button
            onClick={() => onToggleViewMode('list')}
            title="List view"
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UnorderedListOutlined className="text-sm" />
          </button>
          <button
            onClick={() => onToggleViewMode('grid')}
            title="Grid view"
            className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AppstoreOutlined className="text-sm" />
          </button>
        </div>

        <Button
          type="text"
          icon={<InfoCircleOutlined className="text-slate-500 text-base" />}
          shape="circle"
          size="middle"
          title="View details"
          className="hover:bg-slate-100"
        />
      </div>
    </div>
  )
}
