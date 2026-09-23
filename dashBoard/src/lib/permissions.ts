import type { AppPagePermission } from '@/types'
import { APP_PAGES, type PageCategory, type PagePermissionLevel } from '@/config/pages.config'
export type { PageCategory, PagePermissionLevel }

export type PageDefinition = {
  key: AppPagePermission
  title: string
  path: string
  category: PageCategory
  description: string
}

export const getAllPages = (): PageDefinition[] => {
  return (APP_PAGES || [])
    .filter((p) => p.key !== 'settings')
    .map((p) => ({
      key: p.key,
      title: p.title,
      path: p.path,
      category: p.category,
      description: p.description,
    }))
}

export const ALL_PAGES: PageDefinition[] = new Proxy([] as PageDefinition[], {
  get(_target, prop, receiver) {
    const pages = getAllPages()
    const value = Reflect.get(pages, prop, receiver)
    return typeof value === 'function' ? value.bind(pages) : value
  },
})

export const isUserAdmin = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN')
}

export const isUserManager = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'MANAGER')
}

export const isInternalUser = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'INTERNAL_USER')
}

export const isExternalUser = (user: { roles?: string[] } | null): boolean => {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  return roles.some((r) => r.toUpperCase() === 'EXTERNAL_USER')
}

/**
 * Parse an accessiblePages raw array/object into a map of pageKey -> PagePermissionLevel
 */
export function parseAccessiblePages(raw: unknown): Record<string, PagePermissionLevel> {
  const map: Record<string, PagePermissionLevel> = {}
  if (!raw) return map

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'string') continue
      if (item === '*') {
        for (const p of ALL_PAGES) {
          map[p.key] = 'edit'
        }
        continue
      }
      if (item.includes(':')) {
        const [k, level] = item.split(':')
        if (level === 'view' || level === 'edit' || level === 'none') {
          map[k] = level as PagePermissionLevel
        }
      } else {
        // Legacy entry without colon -> default to 'edit'
        map[item] = 'edit'
      }
    }
  } else if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === 'view' || v === 'edit' || v === 'none') {
        map[k] = v as PagePermissionLevel
      }
    }
  }

  return map
}

/**
 * Serialize a map of pageKey -> PagePermissionLevel into a string array ['pageKey:view', ...]
 */
export function serializeAccessiblePages(map: Record<string, PagePermissionLevel>): string[] {
  const result: string[] = []
  for (const [pageKey, level] of Object.entries(map)) {
    if (level === 'view' || level === 'edit') {
      result.push(`${pageKey}:${level}`)
    }
  }
  return result
}

/**
 * Get the exact permission level ('none' | 'view' | 'edit') for a user on a given page
 */
export const getPagePermissionLevel = (
  user: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey: AppPagePermission
): PagePermissionLevel => {
  if (!user) return 'none'
  if (isUserAdmin(user)) return 'edit'

  const map = parseAccessiblePages(user.accessiblePages)
  if (map[pageKey]) {
    return map[pageKey]
  }

  // Fallback defaults if accessiblePages is not explicitly set on the user record
  if (user.accessiblePages === null || user.accessiblePages === undefined) {
    if (isUserManager(user)) {
      const defaultManagerPages: AppPagePermission[] = APP_PAGES.filter(
        (p) => p.defaultManagerLevel && p.defaultManagerLevel !== 'none'
      ).map((p) => p.key)
      return defaultManagerPages.includes(pageKey) ? 'edit' : 'none'
    }

    if (isInternalUser(user) || isExternalUser(user)) {
      const defaultUserPages: AppPagePermission[] = [
        'status-board',
        'impact-board',
        'create-assessment',
        'image-converter',
      ]
      return defaultUserPages.includes(pageKey) ? 'edit' : 'none'
    }
  }

  return 'none'
}

/**
 * Check if the user has access to a specific page (either view or edit)
 */
export const hasUserPageAccess = (
  user: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey?: AppPagePermission
): boolean => {
  if (!user) return false
  if (!pageKey) return true
  if (isUserAdmin(user)) return true
  return getPagePermissionLevel(user, pageKey) !== 'none'
}

/**
 * Check if the user has edit access to a specific page
 */
export const canUserEditPage = (
  user: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey?: AppPagePermission
): boolean => {
  if (!user) return false
  if (!pageKey) return true
  if (isUserAdmin(user)) return true
  return getPagePermissionLevel(user, pageKey) === 'edit'
}

/**
 * Compute the maximum permission level allowed for a subordinate based on their manager's access
 */
export const getManagerAllowedPermissionLevel = (
  manager: { roles?: string[]; accessiblePages?: unknown } | null,
  pageKey: AppPagePermission
): PagePermissionLevel => {
  if (!manager) return 'none'
  if (isUserAdmin(manager)) return 'edit'
  return getPagePermissionLevel(manager, pageKey)
}

