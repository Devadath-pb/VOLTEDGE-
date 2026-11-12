export const fmt = (v, digits = 2) =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(digits)

export const fmtTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const fmtDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const sohCategory = (soh) => {
  if (soh == null) return { label: 'Unknown', color: 'bg-slate-100 text-slate-600' }
  if (soh >= 90) return { label: 'Excellent', color: 'bg-mint text-darkgreen' }
  if (soh >= 80) return { label: 'Good', color: 'bg-emerald-100 text-emerald-700' }
  if (soh >= 70) return { label: 'Fair', color: 'bg-amber-100 text-amber-700' }
  if (soh >= 60) return { label: 'Degraded', color: 'bg-orange-100 text-orange-700' }
  return { label: 'End of Life', color: 'bg-red-100 text-red-600' }
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const toCSV = (rows, columns) => {
  const head = columns.map((c) => c.label).join(',')
  const body = rows.map((r) => columns.map((c) => JSON.stringify(r[c.key] ?? '')).join(',')).join('\n')
  return head + '\n' + body
}

export const downloadFile = (content, filename, mime = 'text/csv') => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
