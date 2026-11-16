import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getJSON, postJSON, endpoints } from '../services/api.js'
import { useAuth } from './AuthContext.jsx'

const AppContext = createContext(null)

let toastId = 0

const DEMO_BATTERIES = [
  {
    battery_id: 'demo-primary',
    serial_number: 'VE-DEMO-3600',
    manufacturer: 'Voltedge Lab',
    model: 'Demo Pack 01',
    chemistry: 'Li-ion',
    rated_capacity_mah: 3600,
    nominal_voltage: 3.7,
    status: 'Active',
    is_active: true,
  },
  {
    battery_id: 'demo-secondary',
    serial_number: 'VE-DEMO-2400',
    manufacturer: 'Voltedge Lab',
    model: 'Demo Pack 02',
    chemistry: 'Li-ion',
    rated_capacity_mah: 2400,
    nominal_voltage: 3.7,
    status: 'Standby',
    is_active: false,
  },
]

export function AppProvider({ children }) {
  const { user, configured } = useAuth()
  const [demoMode, setDemoModeState] = useState(
    import.meta.env.VITE_FORCE_DEMO === 'true' || !import.meta.env.VITE_API_BASE_URL
  )
  const [connected, setConnected] = useState(false)
  const [lastValidReading, setLastValidReading] = useState(null)
  const [toasts, setToasts] = useState([])
  const [batteries, setBatteries] = useState([])
  const [selectedBattery, setSelectedBattery] = useState(null)
  const [batteriesLoading, setBatteriesLoading] = useState(false)
  const [batteryActionLoading, setBatteryActionLoading] = useState(false)
  const [batteriesError, setBatteriesError] = useState(null)
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

  const batteryStorageKey = `voltedge:selected-battery:${user?.id ?? 'demo'}`

  const rememberBattery = useCallback((batteryId) => {
    try { window.localStorage.setItem(batteryStorageKey, batteryId) } catch { /* storage may be unavailable */ }
  }, [batteryStorageKey])

  const chooseFromList = useCallback((list) => {
    let rememberedId = null
    try { rememberedId = window.localStorage.getItem(batteryStorageKey) } catch { /* storage may be unavailable */ }
    return list.find((battery) => battery.is_active)
      || list.find((battery) => battery.battery_id === rememberedId)
      || list[0]
      || null
  }, [batteryStorageKey])

  const refreshBatteries = useCallback(async ({ silent = false } = {}) => {
    if (demoMode) {
      setBatteries(DEMO_BATTERIES)
      setSelectedBattery((current) => current && DEMO_BATTERIES.some((item) => item.battery_id === current.battery_id)
        ? current
        : DEMO_BATTERIES[0])
      setBatteriesError(null)
      return DEMO_BATTERIES
    }
    if (!configured || !user) {
      setBatteries([])
      setSelectedBattery(null)
      return []
    }

    setBatteriesLoading(true)
    try {
      const list = await getJSON(endpoints.batteries)
      const normalized = Array.isArray(list) ? list : []
      setBatteries(normalized)
      const next = chooseFromList(normalized)
      setSelectedBattery(next)
      if (next) rememberBattery(next.battery_id)
      setBatteriesError(null)
      return normalized
    } catch (error) {
      setBatteriesError(error.message)
      if (!silent) pushToast(`Could not load batteries: ${error.message}`, 'error')
      return []
    } finally {
      setBatteriesLoading(false)
    }
  }, [chooseFromList, configured, demoMode, pushToast, rememberBattery, user])

  useEffect(() => {
    refreshBatteries({ silent: true })
  }, [refreshBatteries])

  const selectBattery = useCallback(async (battery) => {
    if (!battery) return null
    setBatteryActionLoading(true)
    try {
      let next = battery
      if (!demoMode) {
        next = await postJSON(endpoints.setActiveBattery(battery.battery_id))
      }
      setBatteries((current) => current.map((item) => ({
        ...item,
        is_active: item.battery_id === battery.battery_id,
      })))
      setSelectedBattery({ ...battery, ...next, is_active: true })
      rememberBattery(battery.battery_id)
      pushToast(`${battery.model || battery.serial_number} is now selected.`, 'success')
      return next
    } catch (error) {
      pushToast(`Could not select battery: ${error.message}`, 'error')
      return null
    } finally {
      setBatteryActionLoading(false)
    }
  }, [demoMode, pushToast, rememberBattery])

  const addBattery = useCallback(async (payload, { provisionDevice = false, deviceName = 'VoltEdge ESP32-C3' } = {}) => {
    setBatteryActionLoading(true)
    try {
      let created
      let deviceKey = null
      let provisionError = null
      if (demoMode) {
        created = {
          ...payload,
          battery_id: `demo-${Date.now()}`,
          status: 'Active',
          is_active: false,
        }
        setBatteries((current) => [...current.map((item) => ({ ...item, is_active: false })), created])
      } else {
        created = await postJSON(endpoints.batteries, payload)
        await refreshBatteries({ silent: true })
      }
      if (provisionDevice) {
        if (demoMode) {
          provisionError = new Error('Device keys are generated only when the live backend is connected.')
        } else {
          try {
            const provisioned = await postJSON(
              endpoints.provisionDeviceKey(created.battery_id),
              { name: deviceName || 'VoltEdge ESP32-C3' },
            )
            deviceKey = provisioned.device_key
          } catch (error) {
            provisionError = error
            pushToast(`Battery added, but device key generation failed: ${error.message}`, 'error')
          }
        }
      }
      const activated = await selectBattery(created)
      if (!activated && !demoMode) {
        await refreshBatteries({ silent: true })
        pushToast('Battery was added, but could not be selected automatically. Choose it from the battery list.', 'info')
      }
      pushToast(`${created.model || created.serial_number} was added.`, 'success')
      return { battery: created, deviceKey, provisionError }
    } catch (error) {
      pushToast(`Could not add battery: ${error.message}`, 'error')
      throw error
    } finally {
      setBatteryActionLoading(false)
    }
  }, [demoMode, pushToast, refreshBatteries, selectBattery])

  // Demo mode banner persists at top of Layout via context flag only.

  return (
    <AppContext.Provider
      value={{
        demoMode, setDemoMode,
        connected, setConnected,
        lastValidReading, setLastValidReading,
        toasts, pushToast, dismissToast,
        settings, updateSetting,
        batteries, selectedBattery, batteriesLoading, batteryActionLoading, batteriesError,
        refreshBatteries, selectBattery, addBattery,
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
