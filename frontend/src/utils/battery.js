import { clamp } from './format.js'

// The current ESP32 payload has voltage but not SOC. These defaults match a
// single-cell Li-ion battery and are used only for a clearly labelled estimate.
export const DEFAULT_BATTERY_VOLTAGE_RANGE = {
  min: 3.0,
  max: 4.2,
}

export function getBatteryPercentage(
  reading,
  voltageRange = DEFAULT_BATTERY_VOLTAGE_RANGE,
) {
  const soc = Number(reading?.soc)
  if (Number.isFinite(soc)) {
    return { value: clamp(soc, 0, 100), source: 'device' }
  }

  const voltage = Number(reading?.voltage)
  if (!Number.isFinite(voltage)) {
    return { value: null, source: null }
  }

  const span = voltageRange.max - voltageRange.min
  const value = span > 0
    ? ((voltage - voltageRange.min) / span) * 100
    : null

  return {
    value: value == null ? null : clamp(value, 0, 100),
    source: value == null ? null : 'voltage-estimate',
  }
}
