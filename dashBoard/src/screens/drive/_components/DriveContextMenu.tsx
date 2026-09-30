import React from 'react'
import { message } from 'antd'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuCheckboxItem,
} from '@/components/ui/context-menu'
import {
  FolderOpen,
  Eye,
  Download,
  Edit3,
  FolderInput,
  Link2,
  Copy,
  Key,
  Trash2,
  FolderPlus,
  UploadCloud,
  RotateCw,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react'
import type { DriveItem, DriveFilterType } from '@/types/drive'

export interface DriveContextMenuProps {
  children: React.ReactNode
  item?: DriveItem | null // If provided, Item Context Menu. If null/undefined, Canvas Context Menu
  targetItem?: DriveItem | null
  selectedItems?: DriveItem[]
  onOpenChange?: (open: boolean) => void
  onOpenFolder?: (item: DriveItem) => void
  onOpenFileLink?: (item: DriveItem) => void
  onRenameItem?: (item: DriveItem) => void
  onMoveItem?: (item: DriveItem) => void
  onDeleteItem?: (item: DriveItem) => void
  onMoveMultiple?: (items: DriveItem[]) => void
  onDeleteMultiple?: (items: DriveItem[]) => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  // Canvas actions
  onCreateFolder?: () => void
  onUploadFile?: () => void
  onRefresh?: () => void
  viewMode?: 'list' | 'grid'
  onToggleViewMode?: (mode: 'list' | 'grid') => void
  filterType?: DriveFilterType
  onSelectFilter?: (type: DriveFilterType) => void
}

export const DriveContextMenu: React.FC<DriveContextMenuProps> = ({
  children,
  item,
  targetItem,
  selectedItems,
  onOpenChange,
  onOpenFolder,
  onOpenFileLink,
  onRenameItem,
  onMoveItem,
  onDeleteItem,
  onMoveMultiple,
  onDeleteMultiple,
  onSelectAll,
  onClearSelection,
  onCreateFolder,
  onUploadFile,
  onRefresh,
  viewMode,
  onToggleViewMode,
  filterType,
  onSelectFilter,
}) => {
  const activeItem = targetItem !== undefined ? targetItem : item

  // 1. Copy link helper
  const handleCopyLink = () => {
    if (!activeItem) return
    const link = activeItem.webViewLink || window.location.href
    navigator.clipboard.writeText(link)
    message.success('Shareable link copied to clipboard!')
  }

  // 2. Copy name helper
  const handleCopyName = () => {
    if (!activeItem) return
    navigator.clipboard.writeText(activeItem.name)
    message.success('Item name copied to clipboard!')
  }

  // 3. Copy ID helper
  const handleCopyId = () => {
    if (!activeItem) return
    navigator.clipboard.writeText(activeItem.id)
    message.success('Google Drive ID copied!')
  }

  // 4. Download file helper
  const handleDownload = () => {
    if (!activeItem || activeItem.isFolder) return
    if (activeItem.webContentLink || activeItem.webViewLink) {
      window.open(activeItem.webContentLink || activeItem.webViewLink, '_blank')
    } else {
      message.warning('Direct download link unavailable')
    }
  }

  const isFolder = activeItem ? Boolean(activeItem.isFolder || activeItem.mimeType === 'application/vnd.google-apps.folder') : false

  const multiSelected =
    selectedItems &&
    selectedItems.length > 1 &&
    (!activeItem || selectedItems.some((it) => it.id === activeItem.id))
      ? selectedItems
      : null

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-56 shadow-xl border border-slate-200/90 rounded-lg p-1.5 text-slate-800 bg-white">
        {/* ============================================================== */}
        {/* ITEM CONTEXT MENU (When right-clicking a File or Folder)        */}
        {/* ============================================================== */}
        {multiSelected ? (
          <>
            {/* Header info for multi-selection */}
            <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                {multiSelected.length} items selected
              </span>
            </div>

            {onMoveMultiple && (
              <ContextMenuItem
                className="gap-2 cursor-pointer font-medium hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={() => onMoveMultiple(multiSelected)}
              >
                <FolderInput className="size-4 text-blue-600" />
                <span>Move {multiSelected.length} items...</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⌘M</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            {onDeleteMultiple && (
              <ContextMenuItem
                variant="destructive"
                className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-md py-1.5 px-2.5 text-xs"
                onClick={() => onDeleteMultiple(multiSelected)}
              >
                <Trash2 className="size-4 text-rose-600" />
                <span>Move to Trash ({multiSelected.length})</span>
                <ContextMenuShortcut className="text-[10px] text-rose-400">⌫</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator className="my-1 bg-slate-100" />

            {onSelectAll && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={onSelectAll}
              >
                <span>Select All</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⌘A</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            {onClearSelection && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={onClearSelection}
              >
                <span>Clear Selection</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">Esc</ContextMenuShortcut>
              </ContextMenuItem>
            )}
          </>
        ) : activeItem ? (
          <>
            {/* Header info */}
            <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                {activeItem.name}
              </span>
            </div>

            {/* Open / Preview Action */}
            <ContextMenuItem
              className="gap-2 cursor-pointer font-medium hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
              onClick={() => {
                if (isFolder && onOpenFolder) {
                  onOpenFolder(activeItem)
                } else if (onOpenFileLink) {
                  onOpenFileLink(activeItem)
                }
              }}
            >
              {isFolder ? <FolderOpen className="size-4 text-blue-600" /> : <Eye className="size-4 text-blue-600" />}
              <span>{isFolder ? 'Open Folder' : 'Preview File'}</span>
              <ContextMenuShortcut className="text-[10px] text-slate-400">↵</ContextMenuShortcut>
            </ContextMenuItem>

            {/* Download File (disabled for folders) */}
            {!isFolder && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={handleDownload}
              >
                <Download className="size-4 text-slate-500" />
                <span>Download</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⌘D</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator className="my-1 bg-slate-100" />

            {/* Management Actions */}
            {onRenameItem && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={() => onRenameItem(activeItem)}
              >
                <Edit3 className="size-4 text-slate-500" />
                <span>Rename</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">F2</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            {onMoveItem && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={() => onMoveItem(activeItem)}
              >
                <FolderInput className="size-4 text-slate-500" />
                <span>Move to...</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⌘M</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator className="my-1 bg-slate-100" />

            {/* Sharing & Copying */}
            <ContextMenuItem
              className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
              onClick={handleCopyLink}
            >
              <Link2 className="size-4 text-slate-500" />
              <span>Get Shareable Link</span>
              <ContextMenuShortcut className="text-[10px] text-slate-400">⌘C</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem
              className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
              onClick={handleCopyName}
            >
              <Copy className="size-4 text-slate-500" />
              <span>Copy Name</span>
            </ContextMenuItem>

            <ContextMenuItem
              className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
              onClick={handleCopyId}
            >
              <Key className="size-4 text-slate-400" />
              <span>Copy Drive ID</span>
            </ContextMenuItem>

            <ContextMenuSeparator className="my-1 bg-slate-100" />

            {/* Destructive: Delete */}
            {onDeleteItem && (
              <ContextMenuItem
                variant="destructive"
                className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-md py-1.5 px-2.5 text-xs"
                onClick={() => onDeleteItem(activeItem)}
              >
                <Trash2 className="size-4 text-rose-600" />
                <span>Move to Trash</span>
                <ContextMenuShortcut className="text-[10px] text-rose-400">⌫</ContextMenuShortcut>
              </ContextMenuItem>
            )}
          </>
        ) : (
          /* ============================================================== */
          /* CANVAS CONTEXT MENU (When right-clicking blank space in Drive)  */
          /* ============================================================== */
          <>
            {onCreateFolder && (
              <ContextMenuItem
                className="gap-2 cursor-pointer font-medium hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={onCreateFolder}
              >
                <FolderPlus className="size-4 text-blue-600" />
                <span>New Folder</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⇧⌘N</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            {onUploadFile && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={onUploadFile}
              >
                <UploadCloud className="size-4 text-emerald-600" />
                <span>Upload File</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⌘U</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            {onRefresh && (
              <ContextMenuItem
                className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800"
                onClick={onRefresh}
              >
                <RotateCw className="size-4 text-slate-500" />
                <span>Refresh Drive</span>
                <ContextMenuShortcut className="text-[10px] text-slate-400">⌘R</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator className="my-1 bg-slate-100" />

            {/* View Mode Submenu */}
            {onToggleViewMode && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800">
                  {viewMode === 'grid' ? <LayoutGrid className="size-4 text-slate-500" /> : <List className="size-4 text-slate-500" />}
                  <span>View Mode</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-40 shadow-lg border border-slate-200/90 rounded-lg p-1 bg-white">
                  <ContextMenuCheckboxItem
                    checked={viewMode === 'list'}
                    onClick={() => onToggleViewMode('list')}
                    className="cursor-pointer text-xs"
                  >
                    List View
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={viewMode === 'grid'}
                    onClick={() => onToggleViewMode('grid')}
                    className="cursor-pointer text-xs"
                  >
                    Grid View
                  </ContextMenuCheckboxItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {/* Filter by Submenu */}
            {onSelectFilter && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="gap-2 cursor-pointer hover:bg-slate-100/90 rounded-md py-1.5 px-2.5 text-xs text-slate-800">
                  <Filter className="size-4 text-slate-500" />
                  <span>Filter Items</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44 shadow-lg border border-slate-200/90 rounded-lg p-1 bg-white">
                  <ContextMenuCheckboxItem
                    checked={filterType === 'ALL'}
                    onClick={() => onSelectFilter('ALL')}
                    className="cursor-pointer text-xs"
                  >
                    All Items
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={filterType === 'folder'}
                    onClick={() => onSelectFilter('folder')}
                    className="cursor-pointer text-xs"
                  >
                    Folders Only
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={filterType === 'document'}
                    onClick={() => onSelectFilter('document')}
                    className="cursor-pointer text-xs"
                  >
                    Documents
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={filterType === 'spreadsheet'}
                    onClick={() => onSelectFilter('spreadsheet')}
                    className="cursor-pointer text-xs"
                  >
                    Spreadsheets
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={filterType === 'pdf'}
                    onClick={() => onSelectFilter('pdf')}
                    className="cursor-pointer text-xs"
                  >
                    PDF Files
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={filterType === 'image'}
                    onClick={() => onSelectFilter('image')}
                    className="cursor-pointer text-xs"
                  >
                    Images
                  </ContextMenuCheckboxItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
