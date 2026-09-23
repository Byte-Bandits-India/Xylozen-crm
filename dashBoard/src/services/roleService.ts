import { apiClient } from '@/lib/apiClient'
import type { FunctionalRole } from '@/types'
import type { Assignee } from '@/types/work'

type ApiUserResponse = {
  publicId?: string
  id?: string
  username?: string
  email: string
  profile?: {
    profileImage?: string
  }
  functionalRole?: string
  affiliation?: string
  roles?: string[]
  managerPublicId?: string | null
  managerName?: string | null
}

export function mapApiUserToAssignee(user: ApiUserResponse): Assignee {
  const roleUpper = user.roles?.[0]?.toUpperCase()
  const isExternal =
    String(user.affiliation).toLowerCase() === 'external' ||
    roleUpper === 'EXTERNAL_USER'
  const systemRole: 'ADMIN' | 'MANAGER' | 'INTERNAL_USER' | 'EXTERNAL_USER' | undefined =
    roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN'
      ? 'ADMIN'
      : roleUpper === 'MANAGER'
      ? 'MANAGER'
      : isExternal
      ? 'EXTERNAL_USER'
      : 'INTERNAL_USER'

  return {
    id: user.publicId || user.id || '',
    name: user.username || user.email,
    avatar: user.profile?.profileImage || '',
    role: user.functionalRole || (isExternal ? 'Contractor' : 'Member'),
    systemRole,
    affiliation: isExternal ? 'external' : 'internal',
    email: user.email,
    managerPublicId: user.managerPublicId,
    managerName: user.managerName,
  }
}

export const roleService = {
  getFunctionalRoles: async (): Promise<FunctionalRole[]> => {
    try {
      const res = await apiClient.get('/admin/functional-roles')
      const roles = res.data?.data || res.data
      return Array.isArray(roles) ? roles : []
    } catch {
      return []
    }
  },

  createFunctionalRole: async (roleData: {
    name: string
    description?: string
    color?: string
  }): Promise<FunctionalRole> => {
    const res = await apiClient.post('/admin/functional-roles', roleData)
    return res.data?.data || res.data
  },

  deleteFunctionalRole: async (publicId: string): Promise<void> => {
    await apiClient.delete(`/admin/functional-roles/${publicId}`)
  },
}
