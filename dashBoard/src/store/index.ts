import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import workReducer from './workSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    work: workReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Centralized persistence subscriber for work slice
// This ensures every Redux mutation (addWorkItem, moveWorkItem, etc.)
// automatically persists to localStorage before any navigation or API call,
// preventing the race condition where stale localStorage overwrites fresh Redux state.
const STORAGE_KEY = 'work-assignment-state'

store.subscribe(() => {
  const state = store.getState()
  try {
    const toStore = {
      workItems: state.work.workItems,
      teamDirectory: state.work.teamDirectory,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // Storage full or unavailable — state simply won't persist across reloads.
  }
})
