import { motion } from 'framer-motion'
import { Download, FileText, History as HistoryIcon } from 'lucide-react'
import PageHeader from '../components/common/PageHeader.jsx'
import GlassCard from '../components/common/GlassCard.jsx'
import DataTable from '../components/common/DataTable.jsx'
import DateRangeFilter from '../components/common/DateRangeFilter.jsx'
import { ParameterHistoryChart } from '../components/charts/HistoricalChart.jsx'
import { LoadingState, ErrorState, DemoBadge, EmptyState } from '../components/common/states.jsx'
import { useBatteryHistory } from '../hooks/useBatteryHistory.js'
import { useApp } from '../context/AppContext.jsx'
import { fmt, fmtDateTime, toCSV, downloadFile } from '../utils/format.js'

export default function HistoryPage() {
  const { rows, loading, error, filters, setFilters, statistics } = useBatteryHistory()
  const { demoMode, pushToast } = useApp()

  const cycles = [...new Set(rows.map((r) => r.cycle))].sort((a, b) => a - b)

  const exportCSV = () => {
    if (!rows.length) return pushToast('Nothing to export — no records match the filters.', 'info')
    downloadFile(
      toCSV(rows, [
        { key: 'timestamp', label: 'DateTime' },
        { key: 'voltage', label: 'Voltage (V)' },
        { key: 'current', label: 'Current (A)' },
        { key: 'temperature', label: 'Temperature (°C)' },
        { key: 'soc', label: 'SOC (%)' },
        { key: 'predictedSoh', label: 'Predicted SOH (%)' },
        { key: 'cycle', label: 'Cycle' },
      ]),
      `voltedge-history-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    pushToast(`Exported ${rows.length} records to CSV.`, 'success')
  }

  const exportPDF = () => {
    // Lightweight printable report via the browser's print pipeline (no extra deps).
    if (!rows.length) return pushToast('No records available for a report.', 'info')
    const html = `<!doctype html><html><head><title>Voltedge Report</title>
      <style>body{font-family:Inter,Arial,sans-serif;padding:32px;color:#102A22}
      h1{color:#14532D}table{border-collapse:collapse;width:100%;font-size:12px;margin-top:16px}
      th,td{border:1px solid #DCFCE7;padding:6px 8px;text-align:left}th{background:#F0FDF4}
      .note{color:#64748B;font-size:11px;margin-top:24px}</style></head><body>
      <h1>Voltedge — Battery History Report</h1>
      <p>Generated ${new Date().toLocaleString()} · ${rows.length} records</p>
      <table><tr><th>Date/Time</th><th>Voltage (V)</th><th>Current (A)</th><th>Temp (°C)</th><th>SOC (%)</th><th>Pred. SOH (%)</th><th>Cycle</th></tr>
      ${rows.map((r) => `<tr><td>${fmtDateTime(r.timestamp)}</td><td>${fmt(r.voltage)}</td><td>${fmt(r.current)}</td><td>${fmt(r.temperature, 1)}</td><td>${fmt(r.soc, 1)}</td><td>${fmt(r.predictedSoh, 1)}</td><td>${r.cycle}</td></tr>`).join('')}
      </table><p class="note">Report contains only records available at generation time.</p>
      </body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const exportPredictions = () => {
    const preds = rows.filter((r) => r.predictedSoh != null)
    if (!preds.length) return pushToast('No prediction history available to download.', 'info')
    downloadFile(
      toCSV(preds, [
        { key: 'timestamp', label: 'DateTime' },
        { key: 'predictedSoh', label: 'Predicted SOH (%)' },
        { key: 'cycle', label: 'Cycle' },
      ]),
      `voltedge-predictions-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    pushToast(`Downloaded ${preds.length} prediction records.`, 'success')
  }

  if (loading) return <div className="pt-8"><LoadingState label="Loading battery history…" /></div>
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />

  const chartsFor = (param) => filters.parameter === 'all' || filters.parameter === param

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Battery History & Performance"
        subtitle="Historical readings, SOH predictions and exportable reports."
        right={<>{demoMode && <DemoBadge />}
          <button onClick={exportCSV} className="btn-secondary !px-4 !py-2 text-xs"><Download className="h-4 w-4" /> Export CSV</button>
          <button onClick={exportPDF} className="btn-secondary !px-4 !py-2 text-xs"><FileText className="h-4 w-4" /> PDF Report</button>
          <button onClick={exportPredictions} className="btn-primary !px-4 !py-2 text-xs"><HistoryIcon className="h-4 w-4" /> Prediction History</button></>}
      />

      <DateRangeFilter filters={filters} setFilters={setFilters} cycles={cycles} />

      {statistics && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            { label: 'Total Cycles', value: statistics.totalCycles, unit: '' },
            { label: 'SOH Change', value: statistics.sohChange, unit: 'pp', digits: 2, signed: true },
            { label: 'Latest SOH', value: statistics.capacityDegradation, unit: '%' },
            { label: 'Avg Temperature', value: statistics.avgTemp, unit: '°C', digits: 1 },
            { label: 'Records', value: rows.length, unit: '' },
          ].map((s) => (
            <GlassCard key={s.label} className="!p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="mt-1 font-poppins text-xl font-bold text-ink">
                {s.signed && s.value != null && s.value > 0 ? '+' : ''}{fmt(s.value, s.digits ?? 0)}{s.unit && <span className="text-sm text-muted"> {s.unit}</span>}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {chartsFor('soh') && <ParameterHistoryChart title="SOH over Time" data={rows} dataKey="predictedSoh" unit="%" color="#14532D" />}
        {chartsFor('voltage') && <ParameterHistoryChart title="Voltage History" data={rows} dataKey="voltage" unit="V" area />}
        {chartsFor('current') && <ParameterHistoryChart title="Current History" data={rows} dataKey="current" unit="A" color="#22C55E" area />}
        {chartsFor('temperature') && <ParameterHistoryChart title="Temperature History" data={rows} dataKey="temperature" unit="°C" color="#F59E0B" area />}
        {chartsFor('soc') && <ParameterHistoryChart title="SOC History" data={rows} dataKey="soc" unit="%" color="#0EA5E9" area />}
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-poppins text-lg font-bold text-ink">Records</h2>
        {rows.length ? (
          <GlassCard className="!p-4">
            <DataTable
              rows={rows}
              columns={[
                { key: 'timestamp', label: 'Date & Time', render: (v) => <span className="whitespace-nowrap text-muted">{fmtDateTime(v)}</span> },
                { key: 'voltage', label: 'Voltage (V)', render: (v) => fmt(v) },
                { key: 'current', label: 'Current (A)', render: (v) => fmt(v) },
                { key: 'temperature', label: 'Temp (°C)', render: (v) => fmt(v, 1) },
                { key: 'soc', label: 'SOC (%)', render: (v) => fmt(v, 1) },
                { key: 'predictedSoh', label: 'Pred. SOH (%)', render: (v) => <span className="font-semibold text-darkgreen">{fmt(v, 1)}</span> },
                { key: 'cycle', label: 'Cycle', sortable: true },
              ]}
            />
          </GlassCard>
        ) : (
          <EmptyState title="No records match the current filters" hint="Adjust the date range or cycle filter above." />
        )}
      </div>
    </motion.div>
  )
}
