import React, { useState, useRef } from 'react'
import { message } from 'antd'
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

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DriveItem | null>(null)
  const [moveTarget, setMoveTarget] = useState<DriveItem | null>(null)

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driveService.deleteItem(id),
    onSuccess: () => {
      message.success('Item moved to trash')
      queryClient.invalidateQueries({ queryKey: ['drive-files'] })
      queryClient.invalidateQueries({ queryKey: ['drive-all-folders'] })
    },
    onError: () => {
      message.error('Failed to delete item')
    },
  })

  // Handlers
  const handleNavigateBreadcrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
  }

  const handleOpenFolder = (folder: DriveItem) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }

  const handleOpenFileLink = (file: DriveItem) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    } else {
      message.info(`Opening ${file.name}`)
    }
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

      {/* 3. Main Content: Table or Grid View */}
      {viewMode === 'list' ? (
        <DriveTable
          items={items}
          loading={isLoading}
          onOpenFolder={handleOpenFolder}
          onRenameItem={(item) => setRenameTarget(item)}
          onMoveItem={(item) => setMoveTarget(item)}
          onDeleteItem={(item) => deleteMutation.mutate(item.id)}
          onOpenFileLink={handleOpenFileLink}
        />
      ) : (
        <DriveGridView
          items={items}
          loading={isLoading}
          onOpenFolder={handleOpenFolder}
          onRenameItem={(item) => setRenameTarget(item)}
          onMoveItem={(item) => setMoveTarget(item)}
          onDeleteItem={(item) => deleteMutation.mutate(item.id)}
          onOpenFileLink={handleOpenFileLink}
        />
      )}

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
        open={Boolean(moveTarget)}
        item={moveTarget}
        folders={allFolders}
        onClose={() => setMoveTarget(null)}
        onMove={(id, targetFolderId, currentParentId) =>
          moveMutation.mutate({ id, targetFolderId, currentParentId })
        }
        loading={moveMutation.isPending}
      />
    </div>
  )
}
