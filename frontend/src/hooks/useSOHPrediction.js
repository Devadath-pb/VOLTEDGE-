import { useEffect, useState } from 'react'
import { getJSON, postJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'

// Loads collected SOH features. Model inference is explicitly triggered by the
// user so a one-second telemetry stream does not cause one prediction per second.
export function useSOHPrediction() {
  const { demoMode } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [predicting, setPredicting] = useState(false)

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
      // The first request may load the Random Forest artifact on the Render
      // instance. Give only the analytics request time to complete that warm-up.
      getJSON(endpoints.soh, undefined, { timeout: 45000 })
        .then((d) => { if (!cancelled) { setData(d); setError(null) } })
        .catch((e) => {
          if (!cancelled) {
            setData(null)
            setError(e.message)
          }
        })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    load()
    const t = setInterval(load, 10000) // refresh collected features, never inference
    return () => { cancelled = true; clearInterval(t) }
  }, [demoMode])

  const predict = async () => {
    setPredicting(true)
    setError(null)
    try {
      const next = demoMode
        ? makeSOHPrediction()
        : await postJSON(endpoints.sohPredict, null, { timeout: 45000 })
      setData(next)
      return next
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setPredicting(false)
    }
  }

  return { data, loading, error, predicting, predict }
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
