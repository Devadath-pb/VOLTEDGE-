import { useEffect, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import { makeSOHPrediction } from '../utils/demoData.js'

// Fetches the automatic SOH prediction + analytics payload.
// Demo mode returns structured mock data; uncertainty is only surfaced when supplied.
export function useSOHPrediction() {
  const { demoMode, setDemoMode } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = () => {
      if (demoMode) {
        setData(makeSOHPrediction())
        setError(null)
        setLoading(false)
        return
      }
      getJSON(endpoints.soh)
        .then((d) => { if (!cancelled) { setData(d); setError(null) } })
        .catch(() => {
          if (!cancelled) {
            setData(makeSOHPrediction())
            setDemoMode(true)
            setError(null)
          }
        })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    load()
    const t = setInterval(load, 30000) // automatic refresh, no manual trigger needed
    return () => { cancelled = true; clearInterval(t) }
  }, [demoMode])

  return { data, loading, error }
}

export function useTrends() {
  const { demoMode } = useApp()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (demoMode) { setData(null); return }
    getJSON(endpoints.trends).then(setData).catch((e) => setError(e.message))
  }, [demoMode])
  return { data, error }
}
