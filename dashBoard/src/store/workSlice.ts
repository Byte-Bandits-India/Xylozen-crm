import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WorkItem, Assignee, Priority, WorkStatus, UserRole, UserAffiliation, SubTask } from '@/types/work'

type WorkState = {
  workItems: WorkItem[]
  teamDirectory: Assignee[]
  searchQuery: string
  priorityFilter: Priority | 'all'
  statusFilter: WorkStatus | 'all'
  roleFilter: UserRole | 'all'
  affiliationFilter: UserAffiliation | 'all'
}

const STORAGE_KEY = 'work-assignment-state'

const loadFromStorage = (): Partial<WorkState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Corrupt or inaccessible localStorage
  }
  return {}
}

const initialStoredState = loadFromStorage()

const initialState: WorkState = {
  workItems: Array.isArray(initialStoredState.workItems) ? initialStoredState.workItems : [],
  teamDirectory: Array.isArray(initialStoredState.teamDirectory) ? initialStoredState.teamDirectory : [],
  searchQuery: '',
  priorityFilter: 'all',
  statusFilter: 'all',
  roleFilter: 'all',
  affiliationFilter: 'all',
}

const workSlice = createSlice({
  name: 'work',
  initialState,
  reducers: {
    setWorkItems: (state, action: PayloadAction<WorkItem[]>) => {
      state.workItems = action.payload
    },
    setTeamDirectory: (state, action: PayloadAction<Assignee[]>) => {
      state.teamDirectory = action.payload
    },
    addWorkItem: (state, action: PayloadAction<WorkItem>) => {
      state.workItems.push(action.payload)
    },
    updateWorkItem: (state, action: PayloadAction<{ id: string; updates: Partial<WorkItem> }>) => {
      const index = state.workItems.findIndex(
        item => item.id === action.payload.id || (item as any).publicId === action.payload.id || (item as any).customId === action.payload.id
      )
      if (index !== -1) {
        state.workItems[index] = { ...state.workItems[index], ...action.payload.updates }
        const item = state.workItems[index]
        const subtasks = Array.isArray(item.subtasks) ? item.subtasks : []
        const isMainDone = Boolean(item.isMainCompleted || item.status === 'approval')
        item.milestone = {
          total: 1 + subtasks.length,
          completed: (isMainDone ? 1 : 0) + subtasks.filter(s => s.isCompleted).length,
        }
      }
    },
    setSubtasks: (
      state,
      action: PayloadAction<{ id: string; subtasks: SubTask[]; isMainCompleted?: boolean }>
    ) => {
      const index = state.workItems.findIndex(
        item => item.id === action.payload.id || (item as any).publicId === action.payload.id || (item as any).customId === action.payload.id
      )
      if (index !== -1) {
        const item = state.workItems[index]
        item.subtasks = action.payload.subtasks
        if (action.payload.isMainCompleted !== undefined) {
          item.isMainCompleted = action.payload.isMainCompleted
        }
        const isMainDone = Boolean(item.isMainCompleted || item.status === 'approval')
        item.milestone = {
          total: 1 + action.payload.subtasks.length,
          completed: (isMainDone ? 1 : 0) + action.payload.subtasks.filter(s => s.isCompleted).length,
        }
      }
    },
    toggleSubtask: (
      state,
      action: PayloadAction<{ itemId: string; subtaskId: string }>
    ) => {
      const index = state.workItems.findIndex(
        item => item.id === action.payload.itemId || (item as any).publicId === action.payload.itemId || (item as any).customId === action.payload.itemId
      )
      if (index !== -1) {
        const item = state.workItems[index]
        if (!Array.isArray(item.subtasks)) {
          item.subtasks = []
        }
        const subIndex = item.subtasks.findIndex(s => s.id === action.payload.subtaskId)
        if (subIndex !== -1) {
          item.subtasks[subIndex].isCompleted = !item.subtasks[subIndex].isCompleted
          const isMainDone = Boolean(item.isMainCompleted || item.status === 'approval')
          item.milestone = {
            total: 1 + item.subtasks.length,
            completed: (isMainDone ? 1 : 0) + item.subtasks.filter(s => s.isCompleted).length,
          }
        }
      }
    },
    toggleMainTaskCompleted: (
      state,
      action: PayloadAction<{ itemId: string }>
    ) => {
      const index = state.workItems.findIndex(
        item => item.id === action.payload.itemId || (item as any).publicId === action.payload.itemId || (item as any).customId === action.payload.itemId
      )
      if (index !== -1) {
        const item = state.workItems[index]
        item.isMainCompleted = !item.isMainCompleted
        const subtasks = Array.isArray(item.subtasks) ? item.subtasks : []
        const isMainDone = Boolean(item.isMainCompleted || item.status === 'approval')
        item.milestone = {
          total: 1 + subtasks.length,
          completed: (isMainDone ? 1 : 0) + subtasks.filter(s => s.isCompleted).length,
        }
      }
    },
    deleteWorkItem: (state, action: PayloadAction<string>) => {
      state.workItems = state.workItems.filter(
        item => item.id !== action.payload && (item as any).publicId !== action.payload && (item as any).customId !== action.payload
      )
    },
    moveWorkItem: (
      state,
      action: PayloadAction<{
        id: string
        status?: WorkStatus
        priority?: Priority
        overId?: string
      }>
    ) => {
      const { id, status, priority, overId } = action.payload
      const index = state.workItems.findIndex(
        (item) =>
          item.id === id ||
          (item as any).publicId === id ||
          (item as any).customId === id
      )
      if (index === -1) return

      const VALID_STATUSES: WorkStatus[] = [
        'new',
        'todo',
        'clarifications',
        'under_analysis',
        'approval',
      ]
      const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low']

      if (status && VALID_STATUSES.includes(status)) {
        state.workItems[index].status = status
      }
      if (priority && VALID_PRIORITIES.includes(priority)) {
        state.workItems[index].priority = priority
      }

      // Reorder if dropped over another item
      if (overId && overId !== id) {
        const overIndex = state.workItems.findIndex(
          (item) =>
            item.id === overId ||
            (item as any).publicId === overId ||
            (item as any).customId === overId
        )
        if (overIndex !== -1 && overIndex !== index) {
          const [movedItem] = state.workItems.splice(index, 1)
          state.workItems.splice(overIndex, 0, movedItem)
        }
      }
    },
    updateMilestoneProgress: (
      state,
      action: PayloadAction<{ id: string; completed: number; total?: number }>
    ) => {
      const index = state.workItems.findIndex(
        item => item.id === action.payload.id || (item as any).publicId === action.payload.id || (item as any).customId === action.payload.id
      )
      if (index !== -1) {
        state.workItems[index].milestone = {
          completed: action.payload.completed,
          total:
            action.payload.total !== undefined
              ? action.payload.total
              : state.workItems[index].milestone.total,
        }
      }
    },
    addTeamMember: (state, action: PayloadAction<Assignee>) => {
      state.teamDirectory.push(action.payload)
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setPriorityFilter: (state, action: PayloadAction<Priority | 'all'>) => {
      state.priorityFilter = action.payload
    },
    setStatusFilter: (state, action: PayloadAction<WorkStatus | 'all'>) => {
      state.statusFilter = action.payload
    },
    setRoleFilter: (state, action: PayloadAction<UserRole | 'all'>) => {
      state.roleFilter = action.payload
    },
    setAffiliationFilter: (state, action: PayloadAction<UserAffiliation | 'all'>) => {
      state.affiliationFilter = action.payload
    },
  },
})

export const {
  setWorkItems,
  setTeamDirectory,
  addWorkItem,
  updateWorkItem,
  setSubtasks,
  toggleSubtask,
  toggleMainTaskCompleted,
  deleteWorkItem,
  moveWorkItem,
  updateMilestoneProgress,
  addTeamMember,
  setSearchQuery,
  setPriorityFilter,
  setStatusFilter,
  setRoleFilter,
  setAffiliationFilter,
} = workSlice.actions

export default workSlice.reducer
