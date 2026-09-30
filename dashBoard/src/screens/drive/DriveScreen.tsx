import React, { useState, useRef } from 'react'
import { message, Modal } from 'antd'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CloudUploadOutlined } from '@ant-design/icons'
import { driveService } from '@/services/driveService'
import { queryClient } from '@/lib/queryClient'
import type { DriveItem, DriveFilterType, BreadcrumbItem } from '@/types/drive'
import { DriveHeader } from './_components/DriveHeader'
import { DriveFilterBar } from './_components/DriveFilterBar'
import { DriveTable } from './_components/DriveTable'
import { DriveGridView } from './_components/DriveGridView'
import { CreateFolderModal } from './_components/CreateFolderModal'
import { RenameModal } from './_components/RenameModal'
import { MoveItemModal } from './_components/MoveItemModal'
import { DriveContextMenu } from './_components/DriveContextMenu'
import { DriveBatchActionBar } from './_components/DriveBatchActionBar'
import { DriveFilePreviewModal } from './_components/DriveFilePreviewModal'

export default function DriveScreen() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'My Drive' },
  ])
  const currentFolder = breadcrumbs[breadcrumbs.length - 1]
  const currentFolderId = currentFolder?.id || 'root'

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<DriveFilterType>('ALL')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // Selection & Context Menu state
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null)
  const [selectedItems, setSelectedItems] = useState<DriveItem[]>([])
  const [contextMenuTarget, setContextMenuTarget] = useState<DriveItem | null>(null)

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DriveItem | null>(null)
  const [moveTarget, setMoveTarget] = useState<DriveItem | null>(null)
  const [moveMultipleTargets, setMoveMultipleTargets] = useState<DriveItem[]>([])
  const [previewTarget, setPreviewTarget] = useState<DriveItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 1. Fetch files in current folder
  const { data: items = [], isLoading } = useQuery<DriveItem[]>({
    queryKey: ['drive-files', currentFolderId, searchQuery, filterType],
    queryFn: () =>
      driveService.getFiles({
        folderId: currentFolderId,
        search: searchQuery,
        type: filterType,
      }),
  })

  // 2. Fetch all folders for move dialog
  const { data: allFolders = [] } = useQuery<DriveItem[]>({
    queryKey: ['drive-all-folders'],
    queryFn: () => driveService.getFiles({ type: 'folder' }),
  })

  // 3. Mutations
  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      driveService.createFolder({ name, parentFolderId: currentFolderId }),
    onSuccess: (newFolder) => {
      message.success(`Folder "${newFolder.name}" created in Google Drive`)
      setIsCreateFolderOpen(false)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to create folder')
    },
  })

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      return driveService.uploadFile(file, currentFolderId, (percent) => {
        setUploadProgress(percent)
      })
    },
    onSuccess: (uploadedFile) => {
      message.success(`"${uploadedFile.name}" uploaded to Google Drive`)
      setUploadProgress(null)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
    },
    onError: () => {
      message.error('Failed to upload file to Google Drive')
      setUploadProgress(null)
    },
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      driveService.renameItem({ id, name }),
    onSuccess: () => {
      message.success('Item renamed successfully')
      setRenameTarget(null)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to rename item')
    },
  })

  const moveMutation = useMutation({
    mutationFn: ({
      id,
      targetFolderId,
      currentParentId,
    }: {
      id: string
      targetFolderId: string
      currentParentId?: string
    }) => driveService.moveItem({ id, targetFolderId, currentParentId }),
    onSuccess: () => {
      message.success('Item moved successfully')
      setMoveTarget(null)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to move item')
    },
  })

  const moveMultipleMutation = useMutation({
    mutationFn: async ({
      itemsToMove,
      targetFolderId,
    }: {
      itemsToMove: DriveItem[]
      targetFolderId: string
    }) => {
      const results = await Promise.allSettled(
        itemsToMove.map((it) =>
          driveService.moveItem({
            id: it.id,
            targetFolderId,
            currentParentId: it.parentFolderId || 'root',
          })
        )
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length
      return { succeeded, failed, total: itemsToMove.length }
    },
    onSuccess: ({ succeeded, failed, total }) => {
      if (failed === 0) {
        message.success(`${succeeded} item${succeeded > 1 ? 's' : ''} moved successfully`)
      } else if (succeeded > 0) {
        message.warning(`${succeeded} of ${total} items moved (${failed} failed)`)
      } else {
        message.error('Failed to move selected items')
      }
      setMoveTarget(null)
      setMoveMultipleTargets([])
      setSelectedItems([])
      setSelectedItem(null)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to move selected items')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driveService.deleteItem(id),
    onSuccess: () => {
      message.success('Item moved to trash')
      setSelectedItems((prev) => prev.filter((it) => it.id !== selectedItem?.id))
      setSelectedItem(null)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to delete item')
    },
  })

  const deleteMultipleMutation = useMutation({
    mutationFn: async (itemsToDelete: DriveItem[]) => {
      const results = await Promise.allSettled(
        itemsToDelete.map((it) => driveService.deleteItem(it.id))
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length
      return { succeeded, failed, total: itemsToDelete.length }
    },
    onSuccess: ({ succeeded, failed, total }) => {
      if (failed === 0) {
        message.success(`${succeeded} item${succeeded > 1 ? 's' : ''} moved to trash`)
      } else if (succeeded > 0) {
        message.warning(`${succeeded} of ${total} items moved to trash (${failed} failed)`)
      } else {
        message.error('Failed to delete selected items')
      }
      setSelectedItems([])
      setSelectedItem(null)
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to delete selected items')
    },
  })

  // Selection Handlers
  const handleSelectItem = (item: DriveItem | null) => {
    setSelectedItem(item)
  }

  const handleSelectItems = (newItems: DriveItem[]) => {
    setSelectedItems(newItems)
  }

  const handleToggleSelectItem = (item: DriveItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((it) => it.id === item.id)
      return exists ? prev.filter((it) => it.id !== item.id) : [...prev, item]
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      handleClearSelection()
    } else {
      setSelectedItems(items)
    }
  }

  const handleClearSelection = () => {
    setSelectedItems([])
  }

  // Navigation Handlers
  const handleNavigateBreadcrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
    handleClearSelection()
  }

  const handleOpenFolder = (folder: DriveItem) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
    handleClearSelection()
  }

  const handleOpenFileLink = (file: DriveItem) => {
    setPreviewTarget(file)
  }

  const handleTriggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      uploadFileMutation.mutate(file)
    })

    e.target.value = ''
  }

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        uploadFileMutation.mutate(file)
      })
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['drive-files'] })
    queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    message.success('Drive refreshed')
  }

  const handleConfirmDelete = (item: DriveItem) => {
    Modal.confirm({
      title: 'Move to trash?',
      content: `Are you sure you want to move "${item.name}" to Google Drive trash?`,
      okText: 'Move to trash',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(item.id),
    })
  }

  const handleConfirmDeleteMultiple = (itemsToDelete: DriveItem[]) => {
    if (itemsToDelete.length === 0) return
    if (itemsToDelete.length === 1) {
      handleConfirmDelete(itemsToDelete[0])
      return
    }
    Modal.confirm({
      title: `Move ${itemsToDelete.length} items to trash?`,
      content: `Are you sure you want to move these ${itemsToDelete.length} items to Google Drive trash?`,
      okText: `Move ${itemsToDelete.length} items to trash`,
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMultipleMutation.mutate(itemsToDelete),
    })
  }

  const handleDownloadSelected = (itemsToDownload?: DriveItem[]) => {
    const targetList = itemsToDownload || selectedItems
    const downloadable = targetList.filter((it) => !it.isFolder)
    if (downloadable.length === 0) {
      message.info('No downloadable files selected')
      return
    }
    downloadable.forEach((file) => {
      if (file.webContentLink || file.webViewLink) {
        window.open(file.webContentLink || file.webViewLink, '_blank')
      }
    })
  }

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isItem = target.closest('.ant-table-row') || target.closest('[data-drive-item="true"]')
    if (!isItem) {
      setContextMenuTarget(null)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isItem =
      target.closest('.ant-table-row') ||
      target.closest('[data-drive-item="true"]') ||
      target.closest('button') ||
      target.closest('.ant-dropdown') ||
      target.closest('[role="menu"]')
    if (!isItem) {
      handleClearSelection()
    }
  }

  // Comprehensive Keyboard Shortcuts Engine for Drive
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Skip if user is typing in an input, textarea, or a modal is open
      const activeEl = document.activeElement
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true' ||
          activeEl.closest('.ant-modal-root') ||
          activeEl.closest('[role="dialog"]'))
      ) {
        return
      }

      // If any dialog is active, do not execute workspace shortcuts
      if (
        isCreateFolderOpen ||
        Boolean(renameTarget) ||
        Boolean(moveTarget) ||
        moveMultipleTargets.length > 0
      ) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // 1. Shift + Cmd/Ctrl + N: New Folder
      if (e.shiftKey && cmdOrCtrl && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault()
        setIsCreateFolderOpen(true)
        return
      }

      // 2. Cmd/Ctrl + A: Select All
      if (cmdOrCtrl && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        handleSelectAll()
        return
      }

      // 3. Cmd/Ctrl + U: Upload File
      if (cmdOrCtrl && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        handleTriggerFileUpload()
        return
      }

      // 4. Cmd/Ctrl + R: Refresh Drive
      if (cmdOrCtrl && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault()
        handleRefresh()
        return
      }

      // 5. Escape: Clear selection
      if (e.key === 'Escape') {
        handleClearSelection()
        return
      }

      // --- COMMANDS THAT APPLY TO MULTIPLE SELECTED ITEMS ---
      if (selectedItems.length > 1) {
        // Move multiple
        if (cmdOrCtrl && (e.key === 'M' || e.key === 'm')) {
          e.preventDefault()
          setMoveMultipleTargets(selectedItems)
          return
        }

        // Delete multiple
        if (
          e.key === 'Delete' ||
          (isMac && cmdOrCtrl && e.key === 'Backspace') ||
          (!cmdOrCtrl && e.key === 'Backspace')
        ) {
          e.preventDefault()
          handleConfirmDeleteMultiple(selectedItems)
          return
        }

        return
      }

      // --- COMMANDS THAT APPLY TO SINGLE SELECTED ITEM ---
      const activeSingleItem = selectedItem || (selectedItems.length === 1 ? selectedItems[0] : null)

      if (!activeSingleItem) {
        // ArrowDown or ArrowUp when nothing selected selects first item
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length > 0) {
          e.preventDefault()
          handleSelectItem(items[0])
          return
        }
        return
      }

      const currentIndex = items.findIndex((it) => it.id === activeSingleItem.id)

      // 6. ArrowDown: Select Next Item
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (currentIndex < items.length - 1) {
          handleSelectItem(items[currentIndex + 1])
        }
        return
      }

      // 7. ArrowUp: Select Previous Item
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (currentIndex > 0) {
          handleSelectItem(items[currentIndex - 1])
        }
        return
      }

      // 8. Enter: Open folder or file link
      if (e.key === 'Enter') {
        e.preventDefault()
        if (activeSingleItem.isFolder) {
          handleOpenFolder(activeSingleItem)
        } else {
          handleOpenFileLink(activeSingleItem)
        }
        return
      }

      // 9. F2: Rename
      if (e.key === 'F2') {
        e.preventDefault()
        setRenameTarget(activeSingleItem)
        return
      }

      // 10. Cmd/Ctrl + M: Move to...
      if (cmdOrCtrl && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault()
        setMoveTarget(activeSingleItem)
        return
      }

      // 11. Delete or Backspace: Move to Trash
      if (
        e.key === 'Delete' ||
        (isMac && cmdOrCtrl && e.key === 'Backspace') ||
        (!cmdOrCtrl && e.key === 'Backspace')
      ) {
        e.preventDefault()
        handleConfirmDelete(activeSingleItem)
        return
      }

      // 12. Cmd/Ctrl + C: Copy Shareable Link
      if (cmdOrCtrl && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault()
        const link = activeSingleItem.webViewLink || window.location.href
        navigator.clipboard.writeText(link)
        message.success('Shareable link copied to clipboard!')
        return
      }

      // 13. Cmd/Ctrl + D: Download File (if not folder)
      if (cmdOrCtrl && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        if (activeSingleItem.isFolder) {
          message.warning('Cannot download folder directly')
        } else if (activeSingleItem.webContentLink || activeSingleItem.webViewLink) {
          window.open(activeSingleItem.webContentLink || activeSingleItem.webViewLink, '_blank')
        } else {
          message.warning('Direct download link unavailable')
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    items,
    selectedItem,
    selectedItems,
    isCreateFolderOpen,
    renameTarget,
    moveTarget,
    moveMultipleTargets,
  ])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="p-4 sm:p-6 bg-slate-50 w-full min-h-[calc(100vh-4rem)] space-y-4 relative"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-xs border-2 border-dashed border-blue-500 rounded-2xl z-50 flex flex-col items-center justify-center pointer-events-none">
          <CloudUploadOutlined className="text-5xl text-blue-600 mb-2 animate-bounce" />
          <span className="text-sm font-semibold text-blue-800">
            Drop files here to upload directly to Google Drive ({currentFolder.name})
          </span>
        </div>
      )}

      {/* 1. Header with Breadcrumbs, + New Button & View Toggle */}
      <DriveHeader
        breadcrumbs={breadcrumbs}
        onNavigateBreadcrumb={handleNavigateBreadcrumb}
        onOpenNewFolder={() => setIsCreateFolderOpen(true)}
        onTriggerFileUpload={handleTriggerFileUpload}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        isUploading={uploadFileMutation.isPending}
        uploadProgress={uploadProgress}
      />

      {/* 2. Filter Pills & Search Bar */}
      <DriveFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      {/* 3. Main Content: Table or Grid View wrapped in Unified Context Menu */}
      <DriveContextMenu
        targetItem={contextMenuTarget}
        selectedItems={selectedItems}
        onOpenFolder={handleOpenFolder}
        onOpenFileLink={handleOpenFileLink}
        onRenameItem={(item) => setRenameTarget(item)}
        onMoveItem={(item) => setMoveTarget(item)}
        onDeleteItem={(item) => handleConfirmDelete(item)}
        onMoveMultiple={(selected) => setMoveMultipleTargets(selected)}
        onDeleteMultiple={(selected) => handleConfirmDeleteMultiple(selected)}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onCreateFolder={() => setIsCreateFolderOpen(true)}
        onUploadFile={handleTriggerFileUpload}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        filterType={filterType}
        onSelectFilter={setFilterType}
      >
        <div
          className="min-h-[480px]"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasContextMenu}
        >
          {viewMode === 'list' ? (
            <DriveTable
              items={items}
              loading={isLoading}
              selectedItem={selectedItem}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectItems={handleSelectItems}
              onToggleSelectItem={handleToggleSelectItem}
              onSetContextMenuTarget={(item) => setContextMenuTarget(item)}
              onOpenFolder={handleOpenFolder}
              onRenameItem={(item) => setRenameTarget(item)}
              onMoveItem={(item) => setMoveTarget(item)}
              onDeleteItem={(item) => handleConfirmDelete(item)}
              onOpenFileLink={handleOpenFileLink}
            />
          ) : (
            <DriveGridView
              items={items}
              loading={isLoading}
              selectedItem={selectedItem}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectItems={handleSelectItems}
              onToggleSelectItem={handleToggleSelectItem}
              onSetContextMenuTarget={(item) => setContextMenuTarget(item)}
              onOpenFolder={handleOpenFolder}
              onRenameItem={(item) => setRenameTarget(item)}
              onMoveItem={(item) => setMoveTarget(item)}
              onDeleteItem={(item) => handleConfirmDelete(item)}
              onOpenFileLink={handleOpenFileLink}
            />
          )}
        </div>
      </DriveContextMenu>

      {/* Floating Batch Action Bar */}
      <DriveBatchActionBar
        selectedItems={selectedItems}
        totalItemsCount={items.length}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onMoveSelected={() => setMoveMultipleTargets(selectedItems)}
        onDeleteSelected={() => handleConfirmDeleteMultiple(selectedItems)}
        onDownloadSelected={() => handleDownloadSelected(selectedItems)}
        isDeleting={deleteMultipleMutation.isPending}
        isMoving={moveMultipleMutation.isPending}
      />

      {/* Modals */}
      <CreateFolderModal
        open={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={(name) => createFolderMutation.mutate(name)}
        loading={createFolderMutation.isPending}
      />

      <RenameModal
        open={Boolean(renameTarget)}
        item={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={(id, name) => renameMutation.mutate({ id, name })}
        loading={renameMutation.isPending}
      />

      <MoveItemModal
        open={Boolean(moveTarget || moveMultipleTargets.length > 0)}
        item={moveTarget}
        items={moveMultipleTargets}
        folders={allFolders}
        onClose={() => {
          setMoveTarget(null)
          setMoveMultipleTargets([])
        }}
        onMove={(id, targetFolderId, currentParentId) =>
          moveMutation.mutate({ id, targetFolderId, currentParentId })
        }
        onMoveMultiple={(itemsToMove, targetFolderId) =>
          moveMultipleMutation.mutate({ itemsToMove, targetFolderId })
        }
        loading={moveMutation.isPending || moveMultipleMutation.isPending}
      />

      {/* File Preview Modal */}
      <DriveFilePreviewModal
        open={Boolean(previewTarget)}
        file={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  )
}

