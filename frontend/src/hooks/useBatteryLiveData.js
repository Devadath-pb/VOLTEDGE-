import { useEffect, useRef, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import { makeLiveReading, makeLiveSeries } from '../utils/demoData.js'

// Live battery readings from the authenticated backend. The backend reads the
// latest tenant-scoped telemetry stored in Supabase after ESP32 ingestion.
export function useBatteryLiveData(maxPoints = 40) {
  const { demoMode, setConnected, setLastValidReading, pushToast, settings } = useApp()
  const [series, setSeries] = useState(() => (demoMode ? makeLiveSeries(maxPoints) : []))
  const [live, setLive] = useState(() => (demoMode ? makeLiveReading() : null))
  const [source, setSource] = useState(demoMode ? 'demo' : 'connecting')
  const maxRef = useRef(maxPoints)
  maxRef.current = maxPoints
  const errorShownRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let demoTimer = null
    let pollTimer = null

    const push = (reading) => {
      const normalized = {
        ...reading,
        state: String(reading.state || 'idle').toLowerCase(),
        cycleCount: reading.cycleCount ?? null,
      }
      setLive(normalized)
      setSeries((s) => [...s.slice(-(maxRef.current - 1)), normalized])
      if (normalized.timestamp) setLastValidReading(normalized.timestamp)
    }

    if (demoMode) {
      setSource('demo')
      setConnected(false)
      demoTimer = setInterval(() => push(makeLiveReading()), (settings.pollingInterval || 2) * 1000)
      return () => clearInterval(demoTimer)
    }

    const poll = async () => {
      try {
        const payload = await getJSON(endpoints.live)
        if (cancelled) return
        errorShownRef.current = false
        if (payload.reading) push(payload.reading)
        const isConnected = Boolean(payload.connected && payload.reading)
        setConnected(isConnected)
        setSource(isConnected ? 'live' : 'disconnected')
      } catch (error) {
        if (cancelled) return
        setConnected(false)
        setSource('error')
        if (!errorShownRef.current) {
          pushToast(`Live telemetry unavailable: ${error.message}`, 'error')
          errorShownRef.current = true
        }
      }
    }

    poll()
    const intervalMs = Math.max(1000, Number(settings.pollingInterval || 2) * 1000)
    pollTimer = setInterval(poll, intervalMs)

    return () => {
      cancelled = true
      clearInterval(demoTimer)
      clearInterval(pollTimer)
    }
  }, [demoMode, setConnected, setLastValidReading, pushToast, settings.pollingInterval])

  return { series, live, source }
}
