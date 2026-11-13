import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap, Activity, Thermometer, BatteryMedium, HeartPulse, Repeat, RefreshCw, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/common/PageHeader.jsx'
import MetricCard from '../components/cards/MetricCard.jsx'
import BatteryVisualization from '../components/battery/BatteryVisualization.jsx'
import LiveLineChart from '../components/charts/LiveLineChart.jsx'
import ConnectionIndicator from '../components/common/ConnectionIndicator.jsx'
import { DemoBadge, EmptyState } from '../components/common/states.jsx'
import { useBatteryLiveData } from '../hooks/useBatteryLiveData.js'
import { useApp } from '../context/AppContext.jsx'
import { fmt, fmtTime } from '../utils/format.js'

export default function Dashboard() {
  const { series, live, source } = useBatteryLiveData(40)
  const { lastValidReading, demoMode } = useApp()
  const authenticationExpired = source === 'auth'
  const disconnected = source === 'disconnected' || source === 'error' || authenticationExpired

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Live Battery Monitoring"
        subtitle="Real-time battery performance and health indicators."
        right={
          <>
            <ConnectionIndicator source={source} />
            <span className={`chip ${source === 'live' ? 'bg-lightmint text-darkgreen' : 'bg-slate-100 text-muted'}`}>
              <span className={`h-2 w-2 rounded-full ${source === 'live' ? 'bg-bright volt-live-dot' : 'bg-slate-400'}`} />
              {source === 'live' ? 'LIVE' : 'NOT LIVE'}
            </span>
            <span className="chip bg-white/80 text-muted">
              <RefreshCw className="h-3.5 w-3.5" />
              {live ? `Updated ${fmtTime(live.timestamp)}` : 'Awaiting data'}
            </span>
            {demoMode && <DemoBadge />}
          </>
        }
      />

      {disconnected && (
        <div className="mb-6 flex items-start gap-3 rounded-glass border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-800 backdrop-blur" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            {authenticationExpired ? (
              <>
                <p className="font-semibold">Your session has expired</p>
                <p className="mt-1">Sign in again to securely load your battery data.</p>
                <Link to="/login" className="mt-3 inline-flex rounded-xl bg-amber-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-800">
                  Sign in again
                </Link>
              </>
            ) : (
              <>
                <p className="font-semibold">Live connection lost</p>
                <p>
                  Showing the last valid readings only.
                  {lastValidReading && <> Last valid reading: <strong>{new Date(lastValidReading).toLocaleString()}</strong>.</>}
                  {' '}Charts will resume automatically when the device reconnects.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <BatteryVisualization
          batteryPercentage={live?.batteryPercentage}
          percentageSource={live?.batteryPercentageSource}
          state={live?.state}
          soh={live?.soh}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2">
          <MetricCard icon={Zap} label="Voltage" value={live ? fmt(live.voltage) : '—'} unit="V" />
          <MetricCard icon={Activity} label="Current" value={live ? fmt(live.current) : '—'} unit="A" />
          <MetricCard icon={Thermometer} label="Temperature" value={live ? fmt(live.temperature, 1) : '—'} unit="°C" />
          <MetricCard
            icon={BatteryMedium}
            label="Battery %"
            value={live ? fmt(live.batteryPercentage, 1) : '—'}
            unit="%"
            footnote={live?.batteryPercentageSource === 'voltage-estimate'
              ? 'Estimated from voltage'
              : live?.batteryPercentageSource === 'coulomb-counted'
                ? 'Calculated from current'
                : 'From device SOC'}
          />
          <MetricCard icon={HeartPulse} label="SOH" value={live ? fmt(live.soh, 1) : '—'} unit="%" footnote={demoMode ? 'Simulated' : 'From ML pipeline'} />
          <MetricCard icon={Repeat} label="Cycle Count" value={live ? live.cycleCount : '—'} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {series.length ? (
          <>
            <LiveLineChart title="Voltage vs Time" data={series} dataKey="voltage" unit="V" demo={source === 'demo'} />
            <LiveLineChart title="Current vs Time" data={series} dataKey="current" unit="A" color="#22C55E" demo={source === 'demo'} />
            <LiveLineChart title="Temperature vs Time" data={series} dataKey="temperature" unit="°C" color="#F59E0B" domain={[15, 45]} demo={source === 'demo'} />
            {series.some((point) => point.soc != null)
              ? <LiveLineChart title="SOC vs Time" data={series} dataKey="soc" unit="%" color="#14532D" domain={[0, 100]} demo={source === 'demo'} />
              : <EmptyState title="SOC is not available yet" hint="Add SOC to the ESP32 telemetry payload or provide it from the backend model." />}
          </>
        ) : (
          <div className="xl:col-span-2">
            <EmptyState title="Waiting for live readings" hint="Connect the battery monitoring device or enable demo mode to see charts." />
          </div>
        )}
      </div>
    </motion.div>
  )
}
