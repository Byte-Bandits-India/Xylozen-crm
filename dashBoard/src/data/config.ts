export const APP_CONFIG = {
  siteName: 'Dashboard',
  apiBase: import.meta.env.VITE_API_BASE_URL || '/api',
  defaultPageSize: 20,
  maxUploadSizeMb: 10,
  dateFormat: 'DD/MM/YYYY',
} as const

export const FEATURE_FLAGS = {
  enableImageConverter: true,
  enableExpenseTracking: true,
} as const
