import { useEffect, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'

export function useBatteryStatus() {
  const { demoMode, setDemoMode, connected, lastValidReading } = useApp()
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
    getJSON(endpoints.status)
      .then((d) => { if (!cancelled) { setStatus(d); setError(null) } })
      .catch(() => {
        if (!cancelled) {
          setDemoMode(true)
          setError(null)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [demoMode, connected, lastValidReading])

  return { status, loading, error }
}
