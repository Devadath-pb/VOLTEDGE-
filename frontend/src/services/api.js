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
    const detail = error?.response?.data?.detail
    const message = Array.isArray(detail)
      ? detail.map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc.at(-1) : 'field'
        return `${field}: ${item?.msg || 'invalid value'}`
      }).join('; ')
      : detail || error?.message || 'Unknown backend error'
    const normalized = new Error(message)
    normalized.statusCode = error?.response?.status
    return Promise.reject(normalized)
  },
)

export const endpoints = {
  batteries: '/batteries/',
  activeBattery: '/batteries/active',
  setActiveBattery: (id) => `/batteries/${id}/set-active`,
  provisionDeviceKey: (id) => `/batteries/${id}/device-key`,
  live: '/api/battery/live',
  status: '/api/battery/status',
  history: '/api/battery/history',
  soh: '/api/analytics/soh',
  sohPredict: '/api/analytics/soh/predict',
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

export const postJSON = async (url, body, config = {}) => {
  const { data } = await api.post(url, body, config)
  return data
}
