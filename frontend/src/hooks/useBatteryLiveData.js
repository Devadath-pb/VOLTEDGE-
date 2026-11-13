import { useEffect, useRef, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import { makeLiveReading, makeLiveSeries } from '../utils/demoData.js'
import { getBatteryPercentage } from '../utils/battery.js'

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
  const pollInFlightRef = useRef(false)

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
      const batteryPercentage = getBatteryPercentage(normalized)
      normalized.batteryPercentage = batteryPercentage.value
      normalized.batteryPercentageSource = batteryPercentage.source
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
      if (pollInFlightRef.current) return
      pollInFlightRef.current = true
      try {
        // Render can take several seconds to wake from an idle state. Give
        // the first live request enough time without spawning overlapping polls.
        const payload = await getJSON(endpoints.live, undefined, { timeout: 45000 })
        if (cancelled) return
        errorShownRef.current = false
        if (payload.reading) push(payload.reading)
        const isConnected = Boolean(payload.connected && payload.reading)
        setConnected(isConnected)
        setSource(isConnected ? 'live' : 'disconnected')
      } catch (error) {
        if (cancelled) return
        setConnected(false)
        const authenticationExpired = error.statusCode === 401
        setSource(authenticationExpired ? 'auth' : 'error')
        if (!errorShownRef.current) {
          pushToast(
            authenticationExpired
              ? 'Your session expired. Sign in again to view live telemetry.'
              : `Live telemetry unavailable: ${error.message}`,
            'error',
          )
          errorShownRef.current = true
        }
      } finally {
        pollInFlightRef.current = false
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
