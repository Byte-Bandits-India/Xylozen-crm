import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import type { WorkItem, WorkStatus, Priority, Assignee, SubTask } from '@/types/work'


const WORK_STORAGE_KEY = 'work-assignment-state'

const getStoredWorkItems = (): WorkItem[] => {
  try {
    const raw = localStorage.getItem(WORK_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.workItems)) {
        return parsed.workItems
      }
    }
  } catch {
    // fallback
  }
  return []
}

const saveStoredWorkItems = (items: WorkItem[]) => {
  try {
    const raw = localStorage.getItem(WORK_STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : {}
    localStorage.setItem(
      WORK_STORAGE_KEY,
      JSON.stringify({ ...current, workItems: items })
    )
  } catch {
    // fallback
  }
}

export const workService = {
  getWorkItems: async (params?: {
    status?: string
    priority?: string
    search?: string
  }): Promise<WorkItem[]> => {
    try {
      const res = await apiClient.get('/work-items', { params })
      const items = res.data?.data || res.data
      if (Array.isArray(items)) {
        saveStoredWorkItems(items)
        return items
      }
    } catch {
      // Backend fallback to local store
    }
    return getStoredWorkItems()
  },

  createWorkItem: async (data: Partial<WorkItem>): Promise<WorkItem> => {
    const newItem: WorkItem = {
      id: `work-${Date.now()}`,
      title: data.title || 'Untitled Assessment',
      description: data.description || '',
      priority: data.priority || 'medium',
      status: data.status || 'new',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      assignees: data.assignees || [],
      milestone: data.milestone || { completed: 0, total: 1 },
      attachmentsCount: data.attachmentsCount || 0,
      attachments: data.attachments || [],
      commentsCount: data.commentsCount || 0,
      createdAt: new Date().toISOString(),
      subtasks: data.subtasks || [],
      isMainCompleted: Boolean(data.isMainCompleted),
    }

    try {
      const res = await apiClient.post('/work-items', data)
      if (res.data?.data) {
        const stored = getStoredWorkItems()
        saveStoredWorkItems([...stored, res.data.data])
        return res.data.data
      }
    } catch {
      // Backend fallback
    }

    const current = getStoredWorkItems()
    saveStoredWorkItems([...current, newItem])
    return newItem
  },

  updateWorkItemStatus: async (
    id: string,
    status: WorkStatus
  ): Promise<void> => {
    const VALID_STATUSES: WorkStatus[] = [
      'new',
      'todo',
      'clarifications',
      'under_analysis',
      'approval',
    ]
    if (!VALID_STATUSES.includes(status)) {
      console.warn(`[workService] Rejecting invalid status update: "${status}" for item "${id}"`)
      return
    }

    try {
      await apiClient.patch(`/work-items/${id}/status`, { status })
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    const updated = items.map((item) =>
      item.id === id || (item as any).publicId === id || (item as any).customId === id ? { ...item, status } : item
    )
    saveStoredWorkItems(updated)
    queryClient.setQueryData(['work-items'], updated)
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
  },

  updateWorkItemPriority: async (
    id: string,
    priority: Priority
  ): Promise<void> => {
    const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low']
    if (!VALID_PRIORITIES.includes(priority)) {
      console.warn(`[workService] Rejecting invalid priority update: "${priority}" for item "${id}"`)
      return
    }

    try {
      await apiClient.patch(`/work-items/${id}/priority`, { priority })
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    const updated = items.map((item) =>
      item.id === id || (item as any).publicId === id || (item as any).customId === id ? { ...item, priority } : item
    )
    saveStoredWorkItems(updated)
    queryClient.setQueryData(['work-items'], updated)
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
  },

  updateWorkItemMilestone: async (
    id: string,
    completed: number,
    total?: number
  ): Promise<WorkItem | null> => {
    try {
      const res = await apiClient.patch(`/work-items/${id}/milestone`, {
        completed,
        total,
        milestone: {
          completed,
          total,
        },
      })
      const updatedItem = res.data?.data || res.data
      if (updatedItem) {
        const items = getStoredWorkItems()
        saveStoredWorkItems(
          items.map((item) =>
            item.id === id || (item as any).publicId === id || (item as any).customId === id
              ? { ...item, ...updatedItem }
              : item
          )
        )
        queryClient.setQueryData(['work-item-detail', id], (old: any) =>
          old ? { ...old, ...updatedItem } : updatedItem
        )
        queryClient.invalidateQueries({ queryKey: ['work-items'] })
        queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
        return updatedItem
      }
    } catch (err) {
      console.warn('Backend updateWorkItemMilestone error, using local fallback:', err)
    }

    const items = getStoredWorkItems()
    let updatedItem: WorkItem | null = null
    const updated = items.map((item) => {
      if (item.id === id || (item as any).publicId === id || (item as any).customId === id) {
        updatedItem = {
          ...item,
          milestone: {
            completed,
            total: total !== undefined ? total : item.milestone?.total || 1,
          },
        }
        return updatedItem
      }
      return item
    })
    saveStoredWorkItems(updated)
    if (updatedItem) {
      queryClient.setQueryData(['work-item-detail', id], updatedItem)
    }
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
    return updatedItem
  },

  updateWorkItem: async (
    id: string,
    updates: Partial<WorkItem>
  ): Promise<WorkItem> => {
    if (updates.milestone) {
      try {
        await apiClient.patch(`/work-items/${id}/milestone`, {
          completed: updates.milestone.completed,
          total: updates.milestone.total,
          milestone: updates.milestone,
        })
      } catch {
        // Fallback or continue
      }
    }

    try {
      const res = await apiClient.patch(`/work-items/${id}`, updates)
      const updated = res.data?.data || res.data
      if (updated) {
        const items = getStoredWorkItems()
        const newItems = items.map((item) =>
          item.id === id || (item as any).publicId === id || (item as any).customId === id
            ? {
                ...item,
                ...updated,
                ...(updates.milestone ? { milestone: updates.milestone } : {}),
              }
            : item
        )
        saveStoredWorkItems(newItems)
        queryClient.setQueryData(['work-item-detail', id], (old: any) =>
          old ? { ...old, ...updated, ...(updates.milestone ? { milestone: updates.milestone } : {}) } : updated
        )
        queryClient.invalidateQueries({ queryKey: ['work-items'] })
        queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
        return updated
      }
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    let updatedItem: WorkItem | null = null
    const newItems = items.map((item) => {
      if (item.id === id || (item as any).publicId === id || (item as any).customId === id) {
        updatedItem = { ...item, ...updates }
        return updatedItem
      }
      return item
    })
    saveStoredWorkItems(newItems)
    if (updatedItem) {
      queryClient.setQueryData(['work-item-detail', id], updatedItem)
    }
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
    return updatedItem || ({ id, ...updates } as WorkItem)
  },

  updateWorkItemSubtasks: async (
    id: string,
    subtasks: SubTask[],
    isMainCompleted?: boolean
  ): Promise<WorkItem | null> => {
    const isMainDone = isMainCompleted !== undefined ? isMainCompleted : false
    const total = 1 + subtasks.length
    const completed = (isMainDone ? 1 : 0) + subtasks.filter((s) => s.isCompleted).length

    const updates: Partial<WorkItem> = {
      subtasks,
      ...(isMainCompleted !== undefined ? { isMainCompleted } : {}),
      milestone: { completed, total },
    }

    try {
      const res = await apiClient.patch(`/work-items/${id}`, updates)
      const updated = res.data?.data || res.data
      if (updated) {
        const items = getStoredWorkItems()
        const newItems = items.map((item) =>
          item.id === id || (item as any).publicId === id || (item as any).customId === id
            ? {
                ...item,
                ...updated,
                subtasks,
                ...(isMainCompleted !== undefined ? { isMainCompleted } : {}),
                milestone: { completed, total },
              }
            : item
        )
        saveStoredWorkItems(newItems)
        queryClient.setQueryData(['work-item-detail', id], (old: any) =>
          old
            ? {
                ...old,
                ...updated,
                subtasks,
                ...(isMainCompleted !== undefined ? { isMainCompleted } : {}),
                milestone: { completed, total },
              }
            : updated
        )
        queryClient.invalidateQueries({ queryKey: ['work-items'] })
        queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
        return updated
      }
    } catch (err) {
      console.warn('Backend updateWorkItemSubtasks error, using local fallback:', err)
    }

    const items = getStoredWorkItems()
    let updatedItem: WorkItem | null = null
    const newItems = items.map((item) => {
      if (item.id === id || (item as any).publicId === id || (item as any).customId === id) {
        updatedItem = {
          ...item,
          subtasks,
          ...(isMainCompleted !== undefined ? { isMainCompleted } : {}),
          milestone: { completed, total },
        }
        return updatedItem
      }
      return item
    })
    saveStoredWorkItems(newItems)
    if (updatedItem) {
      queryClient.setQueryData(['work-item-detail', id], updatedItem)
    }
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
    return updatedItem
  },


  deleteWorkItem: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/work-items/${id}`)
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    saveStoredWorkItems(items.filter((item) => item.id !== id && (item as any).publicId !== id && (item as any).customId !== id))
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
  },

  getAssignableUsers: async (): Promise<Assignee[]> => {
    try {
      const res = await apiClient.get('/work-items/assignable-users')
      const data = res.data?.data || res.data
      if (Array.isArray(data)) {
        return data
      }
    } catch {
      // Backend fallback to empty or handled by caller
    }
    return []
  },
}

