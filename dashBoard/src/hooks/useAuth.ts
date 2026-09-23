import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAppDispatch, useAppSelector } from './redux'
import { setUser, setShowModal, setLoading, clearAuth } from '@/store/authSlice'
import type { User, LoginPayload, LoginResponse } from '@/types'

export function useAuthUser() {
  const user = useAppSelector((state) => state.auth.user)
  const showModal = useAppSelector((state) => state.auth.showModal)
  const loading = useAppSelector((state) => state.auth.loading)

  const isAdmin = (() => {
    if (!user) return false
    const roles = Array.isArray(user.roles) ? user.roles : []
    return roles.some((r) =>
      r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN'
    )
  })()

  const isSuperAdmin = (() => {
    if (!user) return false
    const roles = Array.isArray(user.roles) ? user.roles : []
    return roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN')
  })()

  return { user, showModal, loading, isAdmin, isSuperAdmin }
}

export function useProfile() {
  const dispatch = useAppDispatch()

  return useQuery<User>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const accessToken =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken')

      if (!accessToken) {
        dispatch(setShowModal(true))
        dispatch(setLoading(false))
        throw new Error('No access token')
      }

      const res = await apiClient.get<{ data: User }>('/user/profile')
      const userData = res.data?.data || res.data
      dispatch(setUser(userData as User))
      dispatch(setLoading(false))
      return userData as User
    },
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useLogin() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await apiClient.post<LoginResponse>('/auth/login', payload)
      return res.data
    },
    onSuccess: async (data, variables) => {
      const { accessToken, refreshToken } = data
      const { remember } = variables

      if (remember) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('refreshToken', refreshToken)
      }

      const me = await apiClient.get<{ data: User }>('/user/profile')
      const userData = me.data?.data || me.data
      dispatch(setUser(userData as User))
      dispatch(setShowModal(false))
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      navigate('/', { replace: true })
    },
  })
}

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const refreshToken =
        localStorage.getItem('refreshToken') ||
        sessionStorage.getItem('refreshToken')

      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    },
    onSettled: () => {
      localStorage.clear()
      sessionStorage.clear()
      dispatch(clearAuth())
      queryClient.clear()
      navigate('/')
    },
  })
}
