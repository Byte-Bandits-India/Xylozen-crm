export type DriveFilterType =
  | 'ALL'
  | 'folder'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'

export interface DriveOwner {
  name: string
  email?: string
  photoLink?: string
  isMe?: boolean
}

export interface DriveItem {
  id: string
  name: string
  mimeType: string
  isFolder: boolean
  size?: number | null
  formattedSize?: string
  modifiedTime: string
  webViewLink?: string
  webContentLink?: string
  parentFolderId?: string | null
  owner?: DriveOwner
  shared?: boolean
}

export interface BreadcrumbItem {
  id: string
  name: string
}

export interface CreateFolderInput {
  name: string
  parentFolderId?: string
}

export interface RenameItemInput {
  id: string
  name: string
}

export interface MoveItemInput {
  id: string
  targetFolderId: string
  currentParentId?: string
}
