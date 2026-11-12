import { useEffect, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import { makeReuseRecommendations } from '../utils/demoData.js'

export function useReuseRecommendations() {
  const { demoMode, setDemoMode } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = () => {
      if (demoMode) {
        setData(makeReuseRecommendations())
        setError(null); setLoading(false)
        return
      }
      getJSON(endpoints.reuseRecommendations)
        .then((d) => { if (!cancelled) { setData(d); setError(null) } })
        .catch(() => {
          if (!cancelled) {
            setData(makeReuseRecommendations())
            setDemoMode(true)
            setError(null)
          }
        })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    load()
    return () => { cancelled = true }
  }, [demoMode])

  const getDetails = async (id) => {
    if (demoMode) return data?.find((r) => r.id === id) ?? null
    return getJSON(endpoints.reuseDetails(id))
  }

  return { recommendations: data, loading, error, getDetails }
}
