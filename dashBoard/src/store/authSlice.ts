import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types'

type AuthState = {
  user: User | null
  showModal: boolean
  loading: boolean
}

const initialState: AuthState = {
  user: null,
  showModal: false,
  loading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
    setShowModal: (state, action: PayloadAction<boolean>) => {
      state.showModal = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.showModal = true
    },
  },
})

export const { setUser, setShowModal, setLoading, clearAuth } = authSlice.actions
export default authSlice.reducer
