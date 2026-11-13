import axios from 'axios'
import { supabase } from './supabase.js'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: normalize errors for the UI layer.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      'Unknown backend error'
    const normalized = new Error(message)
    normalized.statusCode = error?.response?.status
    return Promise.reject(normalized)
  },
)

export const endpoints = {
  live: '/api/battery/live',
  status: '/api/battery/status',
  history: '/api/battery/history',
  soh: '/api/analytics/soh',
  trends: '/api/analytics/trends',
  modelMetrics: '/api/analytics/model-metrics',
  reuseRecommendations: '/api/reuse/recommendations',
  reuseDetails: (id) => `/api/reuse/details/${id}`,
  settings: '/api/settings',
}

export const getJSON = async (url, params, config = {}) => {
  const { data } = await api.get(url, { params, ...config })
  return data
}
