import { useMemo, useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, rows, pageSize = 10, emptyLabel = 'No records match the current filters.' }) {
  const [sort, setSort] = useState({ key: null, dir: 'desc' })
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort.key) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key]
      if (va == null) return 1
      if (vb == null) return -1
      return (va > vb ? 1 : va < vb ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1)
    })
    return copy
  }, [rows, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages - 1)
  const slice = sorted.slice(current * pageSize, (current + 1) * pageSize)

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-primary/10">
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                  <button
                    className="inline-flex items-center gap-1 hover:text-ink"
                    onClick={() => c.sortable !== false && toggleSort(c.key)}
                  >
                    {c.label}
                    {c.sortable !== false && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={r.id ?? i} className="border-b border-primary/5 transition-colors hover:bg-lightmint/70">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-3 text-ink">
                    {c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {!slice.length && (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-muted">{emptyLabel}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Page {current + 1} of {pages} · {sorted.length} records
          </span>
          <div className="flex gap-1">
            <button
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="rounded-lg border border-white/80 bg-white/70 p-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next page"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="rounded-lg border border-white/80 bg-white/70 p-2 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
