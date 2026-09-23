import type { DefaultOptionType } from 'antd/es/select'
import type { Assignee } from '@/types/work'

export type AffiliationFilter = 'all' | 'internal' | 'external'

export type ScopedAssigneeOptionsParams = {
  allMembers: Assignee[]
  currentUser?: {
    id?: string
    publicId?: string
    email?: string
  } | null
  isAdmin?: boolean
  isManager?: boolean
  targetManagerPublicId?: string | null
  existingAssigneeIds?: string[]
  affiliationFilter?: AffiliationFilter
}

/**
 * Filter the pool of members based on role and manager relationship.
 * In universal assignment mode, all active team members are assignable by default.
 * If targetManagerPublicId is explicitly provided, it scopes to that manager's team.
 */
export function getScopedAssignees({
  allMembers,
  currentUser: _currentUser,
  isAdmin: _isAdmin,
  isManager: _isManager,
  targetManagerPublicId,
  existingAssigneeIds = [],
  affiliationFilter = 'all',
}: ScopedAssigneeOptionsParams): Assignee[] {
  // 1. Filter candidates by relationship (if targetManagerPublicId is explicitly provided)
  const relationshipFiltered = allMembers.filter((member) => {
    // Always retain existing assignees to avoid stripping assignments
    if (existingAssigneeIds.includes(member.id)) {
      return true
    }

    if (targetManagerPublicId) {
      const isSubordinate =
        member.managerPublicId === targetManagerPublicId ||
        (member as any).managerId === targetManagerPublicId
      const isTheManager = member.id === targetManagerPublicId
      return isSubordinate || isTheManager
    }

    // Universal assignment: all company members are assignable
    return true
  })

  // 2. Filter by affiliation tab ('all' | 'internal' | 'external')
  if (affiliationFilter === 'all') {
    return relationshipFiltered
  }

  return relationshipFiltered.filter((member) => {
    const aff = member.affiliation?.toLowerCase()
    const isExt = aff === 'external' || member.systemRole === 'EXTERNAL_USER'
    if (affiliationFilter === 'external') {
      return isExt
    }
    return !isExt
  })
}

/**
 * Build Ant Design grouped options:
 * - Internal Works Users
 * - External Works Users
 * - Managers & Supervisors
 */
export function buildGroupedAssigneeOptions(
  members: Assignee[],
  allMembersReference: Assignee[] = members,
): DefaultOptionType[] {
  // Build a lookup map for manager names
  const managerLookup = new Map<string, string>()
  allMembersReference.forEach((m) => {
    managerLookup.set(m.id, m.name)
    if ((m as any).publicId) managerLookup.set((m as any).publicId, m.name)
  })

  const internalUsers: Assignee[] = []
  const externalUsers: Assignee[] = []
  const managers: Assignee[] = []
  const admins: Assignee[] = []

  members.forEach((m) => {
    const roleUpper = (m.systemRole || '').toUpperCase()
    const isExt = m.affiliation === 'external' || roleUpper === 'EXTERNAL_USER'
    const isMgr = roleUpper === 'MANAGER'
    const isAdm = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN'

    if (isAdm) {
      admins.push(m)
    } else if (isMgr) {
      managers.push(m)
    } else if (isExt) {
      externalUsers.push(m)
    } else {
      internalUsers.push(m)
    }
  })

  const createOption = (member: Assignee): DefaultOptionType => {
    const resolvedManagerName =
      member.managerName ||
      (member.managerPublicId ? managerLookup.get(member.managerPublicId) : null) ||
      null

    return {
      value: member.id,
      label: member.name,
      title: member.name,
      role: member.role,
      systemRole: member.systemRole,
      affiliation: member.affiliation,
      managerName: resolvedManagerName,
      managerPublicId: member.managerPublicId,
    }
  }

  const groups: DefaultOptionType[] = []

  if (internalUsers.length > 0) {
    groups.push({
      label: `Internal Works Users (${internalUsers.length})`,
      title: 'Internal Works Users',
      options: internalUsers.map(createOption),
    })
  }

  if (managers.length > 0) {
    groups.push({
      label: `Managers & Supervisors (${managers.length})`,
      title: 'Managers & Supervisors',
      options: managers.map(createOption),
    })
  }

  if (externalUsers.length > 0) {
    groups.push({
      label: `External Works Users (${externalUsers.length})`,
      title: 'External Works Users',
      options: externalUsers.map(createOption),
    })
  }

  if (admins.length > 0) {
    groups.push({
      label: `Administrators (${admins.length})`,
      title: 'Administrators',
      options: admins.map(createOption),
    })
  }

  return groups
}
