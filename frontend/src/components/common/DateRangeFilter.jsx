import { RotateCcw, SlidersHorizontal } from 'lucide-react'

export default function DateRangeFilter({ filters, setFilters, cycles = [] }) {
  const reset = () => setFilters({ from: '', to: '', parameter: 'all', cycle: '' })
  return (
    <div className="glass flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex items-center gap-2 pb-2 text-sm font-semibold text-darkgreen sm:pb-0">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </div>
      <label className="text-xs font-semibold text-muted">
        From
        <input
          type="date" className="input-glass mt-1" value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
      </label>
      <label className="text-xs font-semibold text-muted">
        To
        <input
          type="date" className="input-glass mt-1" value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
      </label>
      <label className="text-xs font-semibold text-muted">
        Parameter
        <select
          className="input-glass mt-1" value={filters.parameter}
          onChange={(e) => setFilters({ ...filters, parameter: e.target.value })}
        >
          <option value="all">All parameters</option>
          <option value="soh">Predicted SOH</option>
          <option value="voltage">Voltage</option>
          <option value="current">Current</option>
          <option value="temperature">Temperature</option>
          <option value="soc">SOC</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">
        Cycle
        <select
          className="input-glass mt-1" value={filters.cycle}
          onChange={(e) => setFilters({ ...filters, cycle: e.target.value })}
        >
          <option value="">All cycles</option>
          {cycles.map((c) => <option key={c} value={c}>Cycle {c}</option>)}
        </select>
      </label>
      <button onClick={reset} className="btn-secondary !px-4 !py-2 text-xs">
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
    </div>
  )
}
