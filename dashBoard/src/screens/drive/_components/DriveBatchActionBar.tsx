import React from 'react'
import { FolderInput, Trash2, Download, X, CheckSquare, Square } from 'lucide-react'
import type { DriveItem } from '@/types/drive'

interface DriveBatchActionBarProps {
  selectedItems: DriveItem[]
  totalItemsCount: number
  onClearSelection: () => void
  onSelectAll: () => void
  onMoveSelected: () => void
  onDeleteSelected: () => void
  onDownloadSelected?: () => void
  isDeleting?: boolean
  isMoving?: boolean
}

export const DriveBatchActionBar: React.FC<DriveBatchActionBarProps> = ({
  selectedItems,
  totalItemsCount,
  onClearSelection,
  onSelectAll,
  onMoveSelected,
  onDeleteSelected,
  onDownloadSelected,
  isDeleting = false,
  isMoving = false,
}) => {
  if (selectedItems.length === 0) return null

  const isAllSelected = selectedItems.length === totalItemsCount && totalItemsCount > 0
  const downloadableFiles = selectedItems.filter((item) => !item.isFolder)

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 bg-white/95 text-slate-800 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-200/90 text-xs">
        {/* Selection count badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer text-slate-700 font-medium"
            title={isAllSelected ? 'Deselect all' : 'Select all'}
          >
            {isAllSelected ? (
              <CheckSquare className="size-4 text-blue-600" />
            ) : (
              <Square className="size-4 text-slate-400" />
            )}
            <span>
              {isAllSelected ? 'All' : `${selectedItems.length}`} selected
            </span>
          </button>
        </div>

        {/* Action: Move Selected */}
        <button
          onClick={onMoveSelected}
          disabled={isMoving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer font-medium disabled:opacity-50"
          title="Move selected items to folder (⌘M)"
        >
          <FolderInput className="size-4 text-blue-600" />
          <span>Move</span>
        </button>

        {/* Action: Download (if any files selected) */}
        {downloadableFiles.length > 0 && onDownloadSelected && (
          <button
            onClick={onDownloadSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer font-medium"
            title={`Download ${downloadableFiles.length} file(s)`}
          >
            <Download className="size-4 text-emerald-600" />
            <span>Download ({downloadableFiles.length})</span>
          </button>
        )}

        {/* Action: Delete / Move to Trash */}
        <button
          onClick={onDeleteSelected}
          disabled={isDeleting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 hover:text-rose-700 transition-all cursor-pointer font-medium disabled:opacity-50 border border-rose-200"
          title="Move selected items to Google Drive trash (⌫)"
        >
          <Trash2 className="size-4 text-rose-500" />
          <span>Trash</span>
        </button>

        {/* Dismiss / Clear Selection */}
        <button
          onClick={onClearSelection}
          className="ml-1 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Clear selection (Esc)"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
