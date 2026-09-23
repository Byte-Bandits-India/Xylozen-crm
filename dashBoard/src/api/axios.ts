import axios, { type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from 'axios'

type RefreshTokenResponse = {
  accessToken: string
}

type CustomAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

export const getBaseURL = (): string => {
  const envBase = import.meta.env.VITE_API_BASE_URL
  if (envBase && (!import.meta.env.PROD || !envBase.includes('localhost'))) {
    return envBase
  }
  return '/api'
}

const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
})

api.interceptors.request.use((config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const accessToken: string | null =
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type']
    if (typeof contentType === 'string' && contentType.includes('text/html')) {
      return Promise.reject(
        new AxiosError(
          'Expected JSON response, but received HTML. The API server might be down or misconfigured.',
          'ERR_BAD_RESPONSE',
          response.config,
          response.request,
          response
        )
      )
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken: string | null =
          localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')

        if (!refreshToken) {
          localStorage.clear()
          sessionStorage.clear()
          return Promise.reject(error)
        }

        const res = await axios.post<RefreshTokenResponse>(
          `${getBaseURL()}/auth/refresh`,
          { refreshToken }
        )

        const newAccessToken: string = res.data.accessToken

        if (localStorage.getItem('accessToken')) {
          localStorage.setItem('accessToken', newAccessToken)
        } else {
          sessionStorage.setItem('accessToken', newAccessToken)
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api