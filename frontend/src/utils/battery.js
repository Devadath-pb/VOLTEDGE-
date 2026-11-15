import { clamp } from './format.js'

// SOC is calculated on the ESP32 from time-spaced current samples. The web
// app only normalizes and displays the device-reported value.
export function getBatteryPercentage(reading) {
  const soc = Number(reading?.soc)
  if (Number.isFinite(soc)) {
    const source = reading?.socSource === 'coulomb_counted'
      ? 'coulomb-counted'
      : reading?.socSource === 'voltage_estimate'
        ? 'voltage-estimate'
        : 'device'
    return { value: clamp(soc, 0, 100), source }
  }
  return { value: null, source: null }
}
