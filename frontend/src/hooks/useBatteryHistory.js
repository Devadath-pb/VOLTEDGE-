import { useEffect, useMemo, useState } from 'react'
import { getJSON, endpoints } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import { makeHistory } from '../utils/demoData.js'

// Historical readings + prediction records with client-side filters.
export function useBatteryHistory() {
  const { demoMode, setDemoMode } = useApp()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ from: '', to: '', parameter: 'all', cycle: '' })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    if (demoMode) {
      setRows(makeHistory(14))
      setError(null); setLoading(false)
      return
    }
    getJSON(endpoints.history)
      .then((d) => { if (!cancelled) { setRows(d); setError(null) } })
      .catch((e) => {
        if (cancelled) return
        setRows(makeHistory(14))
        setDemoMode(true)
        setError(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [demoMode])

  const filtered = useMemo(() => {
    let out = rows
    if (filters.from) out = out.filter((r) => new Date(r.timestamp) >= new Date(filters.from))
    if (filters.to) out = out.filter((r) => new Date(r.timestamp) <= new Date(filters.to + 'T23:59:59'))
    if (filters.cycle) out = out.filter((r) => String(r.cycle) === String(filters.cycle))
    return out
  }, [rows, filters])

  const statistics = useMemo(() => {
    if (!filtered.length) return null
    const sohs = filtered.map((r) => r.predictedSoh).filter((v) => v != null)
    const temps = filtered.map((r) => r.temperature)
    const first = sohs[0], last = sohs[sohs.length - 1]
    return {
      totalCycles: Math.max(...filtered.map((r) => r.cycle ?? 0)),
      sohChange: first != null && last != null ? last - first : null,
      capacityDegradation: first != null ? first : null,
      avgTemp: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
      latestSoh: last,
    }
  }, [filtered])

  return { rows: filtered, allRows: rows, loading, error, filters, setFilters, statistics }
}
