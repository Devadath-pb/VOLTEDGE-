import { useEffect, useRef, useState } from 'react'
import { createBatterySocket } from '../services/websocket.js'
import { useApp } from '../context/AppContext.jsx'
import { makeLiveReading, makeLiveSeries } from '../utils/demoData.js'

// Live battery readings via WebSocket (/ws/battery).
// Falls back to clearly-labelled demo data when demoMode is on or the socket fails.
export function useBatteryLiveData(maxPoints = 40) {
  const { demoMode, setConnected, setLastValidReading, pushToast, settings } = useApp()
  const [series, setSeries] = useState(() => (demoMode ? makeLiveSeries(maxPoints) : []))
  const [live, setLive] = useState(() => (demoMode ? makeLiveReading() : null))
  const [source, setSource] = useState(demoMode ? 'demo' : 'connecting')
  const demoRef = useRef(demoMode)
  demoRef.current = demoMode
  const maxRef = useRef(maxPoints)
  maxRef.current = maxPoints

  useEffect(() => {
    let socket = null
    let demoTimer = null

    const push = (reading) => {
      setLive(reading)
      setSeries((s) => [...s.slice(-(maxRef.current - 1)), reading])
      setLastValidReading(reading.timestamp)
    }

    if (demoRef.current) {
      setSource('demo')
      setConnected(false)
      demoTimer = setInterval(() => push(makeLiveReading()), (settings.pollingInterval || 2) * 1000)
      return () => clearInterval(demoTimer)
    }

    socket = createBatterySocket({
      onOpen: () => { setSource('live'); setConnected(true) },
      onMessage: (reading) => push(reading),
      onError: () => {
        setSource('error')
        setConnected(false)
      },
      onClose: () => {
        setSource((s) => (s === 'live' ? 'disconnected' : s))
        setConnected(false)
      },
    })

    if (!socket) {
      setSource('error')
      setConnected(false)
      pushToast('WebSocket URL not configured — check VITE_WS_URL.', 'error')
    }

    return () => { socket?.close(); clearInterval(demoTimer) }
  }, [demoMode, setConnected, setLastValidReading, pushToast, settings.pollingInterval])

  return { series, live, source }
}
