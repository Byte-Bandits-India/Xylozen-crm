import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useAuth } from '@/context/AuthContext'
import {
  setWorkItems,
  setTeamDirectory,
  moveWorkItem,
} from '@/store/workSlice'
import type { WorkStatus, Priority, WorkItem, Assignee } from '@/types/work'
import { workService } from '@/services/workService'
import { mapApiUserToAssignee } from '@/services/roleService'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'

type BoardMode = 'status' | 'priority'

export function useWorkBoardData(mode: BoardMode) {
  const dispatch = useAppDispatch()
  const { user, isAdmin, isManager } = useAuth()

  // Regular users default and lock to their assigned tasks; admins and managers can toggle
  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>(
    isAdmin || isManager ? 'all' : 'assigned'
  )

  // 1. Fetch work items from API with real-time background sync
  const { data: apiWorkItems = [], isLoading: isWorksLoading } = useQuery<WorkItem[]>({
    queryKey: ['work-items'],
    queryFn: () => workService.getWorkItems(),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  // 2. Fetch users/team members from assignable-users endpoint
  const { data: apiUsers = [] } = useQuery<Assignee[]>({
    queryKey: ['assignable-users', user?.publicId],
    queryFn: async () => {
      const users = await workService.getAssignableUsers()
      if (users && users.length > 0) return users
      if (isAdmin) {
        try {
          const res = await apiClient.get('/admin/users?page=1&pageSize=100')
          const raw = res.data?.data || res.data || []
          return (Array.isArray(raw) ? raw : []).map(mapApiUserToAssignee)
        } catch {
          return []
        }
      }
      return []
    },
    staleTime: 60_000,
  })

  // Synchronize API data to Redux for optimistic drag-and-drop
  useEffect(() => {
    if (apiWorkItems && apiWorkItems.length > 0) {
      dispatch(setWorkItems(apiWorkItems))
    }
  }, [apiWorkItems, dispatch])

  useEffect(() => {
    if (apiUsers && apiUsers.length > 0) {
      dispatch(setTeamDirectory(apiUsers))
    }
  }, [apiUsers, dispatch])

  // Listen to window storage events for instant cross-tab sync without page reload
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'work-assignment-state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed.workItems)) {
            dispatch(setWorkItems(parsed.workItems))
            queryClient.invalidateQueries({ queryKey: ['work-items'] })
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [dispatch])

  const workState = useAppSelector((state) => state.work)
  const {
    workItems,
    teamDirectory,
    searchQuery,
    priorityFilter,
    statusFilter,
    roleFilter,
    affiliationFilter,
  } = workState

  const activeItems = workItems.length > 0 ? workItems : apiWorkItems
  const activeDirectory = teamDirectory.length > 0 ? teamDirectory : apiUsers

  // Persistence now handled centrally by store.subscribe() in src/store/index.ts

  // Filter items based on board mode
  const filteredItems = activeItems.filter((item: WorkItem) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDimension =
      mode === 'status'
        ? priorityFilter === 'all' || item.priority === priorityFilter
        : statusFilter === 'all' || item.status === statusFilter

    const matchesRole =
      roleFilter === 'all' ||
      item.assignees.some((assignee) => assignee.role === roleFilter)

    const matchesAffiliation =
      affiliationFilter === 'all' ||
      item.assignees.some((assignee) => assignee.affiliation === affiliationFilter)

    const isDirectlyAssigned = !!(
      user &&
      item.assignees.some(
        (assignee) =>
          (assignee.email && user.email && assignee.email.toLowerCase() === user.email.toLowerCase()) ||
          assignee.id === user.id ||
          assignee.id === user.publicId
      )
    )

    let matchesScope = true
    if (!user) {
      matchesScope = true
    } else if (isAdmin) {
      matchesScope = scopeFilter === 'all' || isDirectlyAssigned
    } else if (isManager) {
      if (scopeFilter === 'assigned') {
        matchesScope = isDirectlyAssigned
      } else {
        matchesScope =
          (item as any).managerPublicId === user.publicId ||
          (item as any).createdByPublicId === user.publicId ||
          isDirectlyAssigned
      }
    } else {
      // Internal or External user: strictly their assigned tasks
      matchesScope = isDirectlyAssigned
    }

    return (
      matchesSearch &&
      matchesDimension &&
      matchesRole &&
      matchesAffiliation &&
      matchesScope
    )
  })

  const handleMoveItem = async (
    itemId: string,
    newStatus?: WorkStatus,
    newPriority?: Priority,
    overId?: string
  ) => {
    dispatch(
      moveWorkItem({
        id: itemId,
        status: newStatus,
        priority: newPriority,
        overId,
      })
    )
    if (newStatus) {
      await workService.updateWorkItemStatus(itemId, newStatus)
    }
    if (newPriority) {
      await workService.updateWorkItemPriority(itemId, newPriority)
    }
  }

  return {
    filteredItems,
    activeDirectory,
    isLoading: isWorksLoading,
    handleMoveItem,
    scopeFilter,
    setScopeFilter,
    filters: {
      searchQuery,
      priorityFilter,
      statusFilter,
      roleFilter,
      affiliationFilter,
    },
  }
}
