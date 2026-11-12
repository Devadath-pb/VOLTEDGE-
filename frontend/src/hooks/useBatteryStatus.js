import { useEffect, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'

export function useBatteryStatus() {
  const { demoMode, lastValidReading } = useApp()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (demoMode) {
      setStatus({
        connected: false, device: 'Voltedge BMS-01 (demo)', demo: true,
        lastCommunication: lastValidReading,
      })
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const load = () => {
      getJSON(endpoints.status)
        .then((d) => { if (!cancelled) { setStatus(d); setError(null) } })
        .catch((e) => { if (!cancelled) setError(e.message) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    load()
    const timer = setInterval(load, 10000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [demoMode])

  return { status, loading, error }
}
