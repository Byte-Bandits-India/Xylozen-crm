import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { setUser, setShowModal, setLoading } from '@/store/authSlice'
import { apiClient } from '@/lib/apiClient'
import type { User, AppPagePermission } from '@/types'
import {
  isUserAdmin,
  isUserManager,
  isInternalUser as isInternalUserCheck,
  isExternalUser as isExternalUserCheck,
  hasUserPageAccess,
  canUserEditPage,
  getPagePermissionLevel,
  type PagePermissionLevel,
} from '@/lib/permissions'

type AuthContextType = {
  user: User | null
  setUser: (user: User | null) => void
  login: (identifier: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
  showModal: boolean
  setShowModal: (show: boolean) => void
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isManager: boolean
  isInternalUser: boolean
  isExternalUser: boolean
  hasPageAccess: (pageKey?: AppPagePermission) => boolean
  canEditPage: (pageKey?: AppPagePermission) => boolean
  getPagePermission: (pageKey?: AppPagePermission) => PagePermissionLevel
  accessiblePages: AppPagePermission[]
  onAuthSuccess: (accessToken: string, refreshToken: string, remember: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)
  const showModal = useAppSelector((state) => state.auth.showModal)
  const loading = useAppSelector((state) => state.auth.loading)

  const isAdmin = isUserAdmin(user)
  const isSuperAdmin = isAdmin
  const isManager = isUserManager(user)
  const isInternalUser = isInternalUserCheck(user)
  const isExternalUser = isExternalUserCheck(user)
  const hasPageAccess = (pageKey?: AppPagePermission) => hasUserPageAccess(user, pageKey)
  const canEditPage = (pageKey?: AppPagePermission) => canUserEditPage(user, pageKey)
  const getPagePermission = (pageKey?: AppPagePermission): PagePermissionLevel =>
    pageKey ? getPagePermissionLevel(user, pageKey) : 'none'
  const accessiblePages: AppPagePermission[] =
    user && Array.isArray(user.accessiblePages) ? user.accessiblePages : []

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const accessToken =
          localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

        if (!accessToken) {
          dispatch(setShowModal(true))
          dispatch(setLoading(false))
          return
        }

        const res = await apiClient.get<{ data: User }>('/user/profile')
        let userData = (res.data?.data || res.data) as User
        try {
          const override = localStorage.getItem('user_profile_override')
          if (override) {
            const parsed = JSON.parse(override)
            if (parsed) {
              const profileOverride = parsed.profile || parsed
              userData = {
                ...userData,
                username: parsed.username || userData.username,
                // Guarantee roles and access are strictly preserved from the authenticated session
                roles: userData.roles && userData.roles.length > 0 ? userData.roles : ['USER'],
                profile: {
                  ...userData.profile,
                  ...(profileOverride.firstName !== undefined ? { firstName: profileOverride.firstName } : {}),
                  ...(profileOverride.lastName !== undefined ? { lastName: profileOverride.lastName } : {}),
                  ...(profileOverride.phone !== undefined ? { phone: profileOverride.phone } : {}),
                  ...(profileOverride.dateOfBirth !== undefined ? { dateOfBirth: profileOverride.dateOfBirth } : {}),
                  ...(profileOverride.gender !== undefined ? { gender: profileOverride.gender } : {}),
                  ...(profileOverride.profileImage !== undefined ? { profileImage: profileOverride.profileImage } : {}),
                },
              }
            }
          }
        } catch {
          // ignore parsing error
        }
        dispatch(setUser(userData))
      } catch {
        localStorage.clear()
        sessionStorage.clear()
        dispatch(setUser(null))
        dispatch(setShowModal(true))
      } finally {
        dispatch(setLoading(false))
      }
    }

    initAuth()
  }, [dispatch])

  const onAuthSuccess = async (
    accessToken: string,
    refreshToken: string,
    remember: boolean
  ) => {
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
    navigate('/', { replace: true })
  }

  const login = async (
    identifier: string,
    password: string,
    remember: boolean
  ): Promise<void> => {
    const isPhone =
      /^\+?[\d\s\-()]+$/.test(identifier) && identifier.replace(/\D/g, '').length >= 7
    const payload = isPhone
      ? { phone: identifier, password, remember }
      : { email: identifier, password, remember }

    const res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      payload
    )

    const { accessToken, refreshToken } = res.data
    await onAuthSuccess(accessToken, refreshToken, remember)
  }

  const logout = async (): Promise<void> => {
    try {
      const refreshToken =
        localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')

      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    } finally {
      localStorage.clear()
      sessionStorage.clear()
      dispatch(setUser(null))
      dispatch(setShowModal(true))
      navigate('/', { replace: true })
    }
  }

  const value: AuthContextType = {
    user,
    setUser: (u) => dispatch(setUser(u)),
    login,
    logout,
    showModal,
    setShowModal: (s) => dispatch(setShowModal(s)),
    loading,
    isAdmin,
    isSuperAdmin,
    isManager,
    isInternalUser,
    isExternalUser,
    hasPageAccess,
    canEditPage,
    getPagePermission,
    accessiblePages,
    onAuthSuccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}