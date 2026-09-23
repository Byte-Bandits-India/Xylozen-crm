import { apiClient } from '@/lib/apiClient'
import type { DriveItem, CreateFolderInput, RenameItemInput, MoveItemInput } from '@/types/drive'

export const driveService = {
  getFiles: async (params?: { folderId?: string; search?: string; type?: string }): Promise<DriveItem[]> => {
    const res = await apiClient.get('/drive/files', { params })
    const data = res.data?.data || res.data
    return Array.isArray(data) ? data : []
  },

  createFolder: async (input: CreateFolderInput): Promise<DriveItem> => {
    const res = await apiClient.post('/drive/folders', input)
    return res.data?.data || res.data
  },

  uploadFile: async (
    file: File,
    parentFolderId = 'root',
    onProgress?: (percent: number) => void
  ): Promise<DriveItem> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('parentFolderId', parentFolderId)

    const res = await apiClient.post('/drive/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
    return res.data?.data || res.data
  },

  renameItem: async (input: RenameItemInput): Promise<DriveItem> => {
    const res = await apiClient.patch(`/drive/files/${input.id}/rename`, { name: input.name })
    return res.data?.data || res.data
  },

  moveItem: async (input: MoveItemInput): Promise<DriveItem> => {
    const res = await apiClient.patch(`/drive/files/${input.id}/move`, {
      targetFolderId: input.targetFolderId,
      currentParentId: input.currentParentId,
    })
    return res.data?.data || res.data
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/drive/files/${id}`)
  },
}
