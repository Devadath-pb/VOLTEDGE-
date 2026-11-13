import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const AppContext = createContext(null)

let toastId = 0

export function AppProvider({ children }) {
  const [demoMode, setDemoModeState] = useState(
    import.meta.env.VITE_FORCE_DEMO === 'true' || !import.meta.env.VITE_API_BASE_URL
  )
  const [connected, setConnected] = useState(false)
  const [lastValidReading, setLastValidReading] = useState(null)
  const [toasts, setToasts] = useState([])
  const [settings, setSettings] = useState({
    theme: 'light',
    notifyOverheat: true,
    notifyLowSoH: true,
    notifyConnectionLoss: true,
    notifyPredictionUpdates: false,
    chartSmooth: true,
    chartPoints: 40,
    deviceName: 'Voltedge BMS-01',
    protocol: 'WebSocket / serial bridge',
    pollingInterval: 1,
  })

  const setDemoMode = useCallback((v) => setDemoModeState(v), [])

  const pushToast = useCallback((message, type = 'info') => {
    const id = ++toastId
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }, [])

  // Demo mode banner persists at top of Layout via context flag only.

  return (
    <AppContext.Provider
      value={{
        demoMode, setDemoMode,
        connected, setConnected,
        lastValidReading, setLastValidReading,
        toasts, pushToast, dismissToast,
        settings, updateSetting,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
