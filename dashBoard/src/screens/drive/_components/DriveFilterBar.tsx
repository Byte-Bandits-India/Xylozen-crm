import React from 'react'
import { Input, Dropdown, type MenuProps } from 'antd'
import {
  SearchOutlined,
  DownOutlined,
  FolderFilled,
  FileTextFilled,
  FileExcelFilled,
  FilePdfFilled,
  FileImageFilled,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloudOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import type { DriveFilterType } from '@/types/drive'

interface DriveFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterType: DriveFilterType
  onFilterTypeChange: (type: DriveFilterType) => void
}

export const DriveFilterBar: React.FC<DriveFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
}) => {
  const typeMenuItems: MenuProps['items'] = [
    {
      key: 'ALL',
      icon: <AppstoreOutlined className="text-slate-500" />,
      label: 'All types',
      onClick: () => onFilterTypeChange('ALL'),
    },
    {
      key: 'folder',
      icon: <FolderFilled className="text-amber-500" />,
      label: 'Folders',
      onClick: () => onFilterTypeChange('folder'),
    },
    {
      key: 'document',
      icon: <FileTextFilled className="text-blue-500" />,
      label: 'Documents',
      onClick: () => onFilterTypeChange('document'),
    },
    {
      key: 'spreadsheet',
      icon: <FileExcelFilled className="text-emerald-500" />,
      label: 'Spreadsheets',
      onClick: () => onFilterTypeChange('spreadsheet'),
    },
    {
      key: 'pdf',
      icon: <FilePdfFilled className="text-rose-500" />,
      label: 'PDFs',
      onClick: () => onFilterTypeChange('pdf'),
    },
    {
      key: 'image',
      icon: <FileImageFilled className="text-purple-500" />,
      label: 'Photos & images',
      onClick: () => onFilterTypeChange('image'),
    },
  ]

  const peopleMenuItems: MenuProps['items'] = [
    { key: 'anyone', icon: <TeamOutlined className="text-slate-500" />, label: 'Anyone' },
    { key: 'me', icon: <UserOutlined className="text-slate-500" />, label: 'Owned by me' },
    { key: 'not-me', icon: <UsergroupAddOutlined className="text-slate-500" />, label: 'Not owned by me' },
  ]

  const modifiedMenuItems: MenuProps['items'] = [
    { key: 'anytime', icon: <CalendarOutlined className="text-slate-500" />, label: 'Any time' },
    { key: 'today', icon: <ClockCircleOutlined className="text-slate-500" />, label: 'Today' },
    { key: 'week', icon: <CalendarOutlined className="text-slate-500" />, label: 'Last 7 days' },
    { key: 'month', icon: <CalendarOutlined className="text-slate-500" />, label: 'Last 30 days' },
    { key: 'year', icon: <CalendarOutlined className="text-slate-500" />, label: 'This year' },
  ]

  const sourceMenuItems: MenuProps['items'] = [
    { key: 'all', icon: <AppstoreOutlined className="text-slate-500" />, label: 'All sources' },
    { key: 'drive', icon: <CloudOutlined className="text-slate-500" />, label: 'Google Drive' },
    { key: 'shared', icon: <ShareAltOutlined className="text-slate-500" />, label: 'Shared with me' },
  ]

  const typeLabels: Record<DriveFilterType, string> = {
    ALL: 'Type',
    folder: 'Folders',
    document: 'Documents',
    spreadsheet: 'Spreadsheets',
    presentation: 'Presentations',
    pdf: 'PDFs',
    image: 'Images',
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      {/* Left Filter Chips matching screenshot */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type ▾ */}
        <Dropdown menu={{ items: typeMenuItems }} trigger={['click']}>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer border ${
              filterType !== 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
          >
            <span>{typeLabels[filterType]}</span>
            <DownOutlined className="text-[10px] text-slate-400" />
          </button>
        </Dropdown>

        {/* 3. People ▾ */}
        <Dropdown menu={{ items: peopleMenuItems }} trigger={['click']}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer">
            <span>People</span>
            <DownOutlined className="text-[10px] text-slate-400" />
          </button>
        </Dropdown>

        {/* 4. Modified ▾ */}
        <Dropdown menu={{ items: modifiedMenuItems }} trigger={['click']}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer">
            <span>Modified</span>
            <DownOutlined className="text-[10px] text-slate-400" />
          </button>
        </Dropdown>

        {/* 5. Source ▾ */}
        <Dropdown menu={{ items: sourceMenuItems }} trigger={['click']}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer">
            <span>Source</span>
            <DownOutlined className="text-[10px] text-slate-400" />
          </button>
        </Dropdown>
      </div>

      {/* Right: Search Input */}
      <div className="w-full sm:w-64">
        <Input
          placeholder="Search in Drive..."
          prefix={<SearchOutlined className="w-3.5 h-3.5 text-slate-400 mr-1" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="text-xs rounded-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white border-transparent hover:border-transparent focus:border-blue-500 transition-all py-1.5"
        />
      </div>
    </div>
  )
}
