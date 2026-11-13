import { motion } from 'framer-motion'
import { Loader2, Clock, Play, Timer } from 'lucide-react'
import PageHeader from '../components/common/PageHeader.jsx'
import GlassCard from '../components/common/GlassCard.jsx'
import SOHGauge from '../components/battery/SOHGauge.jsx'
import { LoadingState, ErrorState, DemoBadge } from '../components/common/states.jsx'
import {
  DegradationChart,
} from '../components/charts/HistoricalChart.jsx'
import { useSOHPrediction } from '../hooks/useSOHPrediction.js'
import { useApp } from '../context/AppContext.jsx'
import { fmt, fmtDateTime, sohCategory } from '../utils/format.js'

export default function Analytics() {
  const { data, loading, error, predicting, predict } = useSOHPrediction()
  const { demoMode } = useApp()

  if (loading) return <div className="pt-8"><LoadingState label="Loading SOH prediction pipeline…" /></div>
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!data) return <ErrorState message="No prediction data returned by the backend." />

  const cat = sohCategory(data.predictedSoh)
  const hasUncertainty = data.uncertainty != null
  const featureCollection = data.featureCollection ?? {}
  const featureValues = featureCollection.features ?? {}
  const featureColumns = data.featureColumns ?? []
  const measurementColumns = data.measurementColumns ?? ['voltage', 'current', 'temperature']
  const hasPredictionTrend = Array.isArray(data.degradation) && data.degradation.some((item) => item.predicted != null)
  const formatFeatureName = (name) => name.replaceAll('_', ' ')
  const formatFeatureValue = (name, value) => {
    if (value == null) return '—'
    if (name === 'cycle') return String(Math.round(value))
    return fmt(value, name.endsWith('_std') ? 4 : 3)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Battery Analytics & SOH Prediction"
        subtitle="Intelligent battery health analysis powered by Machine Learning."
        right={<>{demoMode && <DemoBadge />}
          <span className="chip bg-lightmint text-darkgreen" title="Telemetry is collected continuously; inference runs only from the button"><Timer className="h-3.5 w-3.5" /> Live feature window</span>
          <button
            type="button"
            className="btn-primary !px-4 !py-2 text-xs"
            onClick={predict}
            disabled={predicting || !featureCollection.ready}
            title={featureCollection.ready ? 'Run one SOH prediction using the collected feature window' : featureCollection.message}
          >
            {predicting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {predicting ? 'Predicting…' : data.predictionAvailable ? 'Predict again' : 'Predict SOH'}
          </button>
        </>}
      />

      {/* Prediction overview */}
      <div className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center gap-5 !p-8">
          <SOHGauge value={data.predictedSoh} />
          <span className={`chip ${cat.color} !px-4 !py-1.5 !text-sm`}>{data.predictionAvailable ? `${cat.label} battery health` : 'No prediction yet'}</span>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h2 className="label-caps mb-5">Prediction Overview</h2>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {[
              ['Predicted SOH', data.predictionAvailable ? `${fmt(data.predictedSoh, 1)}%` : 'Not predicted yet'],
              ['Predicted capacity', data.predictedCapacityAh != null ? `≈ ${fmt(data.predictedCapacityAh, 1)} Ah${data.ratedCapacityAh ? ` of ${data.ratedCapacityAh} Ah` : ''}` : '—'],
              ['Last manual prediction', data.predictionAvailable
                ? (data.predictionTimestamp ? fmtDateTime(data.predictionTimestamp) : 'Stored result')
                : 'Not predicted yet'],
              ['ML model', data.model ?? '—'],
              ['Health category', data.predictionAvailable ? cat.label : 'Unknown'],
              ...(hasUncertainty ? [['Prediction uncertainty', `± ${fmt(data.uncertainty, 2)}% (calibrated)`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="border-b border-primary/10 pb-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
                <dd className="mt-1 font-poppins text-lg font-bold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {!hasUncertainty && (
            <p className="mt-4 text-xs italic text-muted">
              Uncertainty is not shown — it requires a calibrated model from the backend.
            </p>
          )}
        </GlassCard>
      </div>

      {/* Collected model inputs */}
      <GlassCard className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="label-caps mb-2">SOH Feature Collection</h2>
            <p className="max-w-3xl text-sm text-muted">
              Telemetry keeps collecting every second. The model aggregates the time-spaced readings below and runs only when you press Predict SOH.
            </p>
          </div>
          <span className={`chip ${featureCollection.ready ? 'bg-mint text-darkgreen' : 'bg-amber-100 text-amber-700'}`}>
            <Clock className="h-3.5 w-3.5" /> {featureCollection.ready ? 'Ready to predict' : 'Collecting features'}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Samples collected', featureCollection.sample_count ?? '—'],
            ['Time window', featureCollection.window_seconds != null ? `${fmt(featureCollection.window_seconds, 1)} s` : '—'],
            ['Active cycle', data.latestCycle ?? '—'],
            ['Window ended', featureCollection.ended_at ? fmtDateTime(featureCollection.ended_at) : '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-primary/10 bg-lightmint/45 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
              <p className="mt-1 font-poppins text-lg font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Measurements collected from battery</p>
          <div className="flex flex-wrap gap-2">
            {measurementColumns.map((column) => (
              <span key={column} className="chip bg-white/85 text-darkgreen">{formatFeatureName(column)}</span>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {featureColumns.map((column) => (
            <div key={column} className="flex items-center justify-between gap-3 border-b border-primary/10 py-2 text-sm">
              <span className="text-muted">{formatFeatureName(column)}</span>
              <span className="font-semibold tabular-nums text-ink">{formatFeatureValue(column, featureValues[column])}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">{featureCollection.message ?? 'Waiting for feature collection.'}</p>
      </GlassCard>

      {/* Available analytics */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {hasPredictionTrend
          ? <DegradationChart data={data.degradation} />
          : <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <Clock className="h-10 w-10 text-primary/50" />
              <p className="font-semibold text-ink">SOH trend will appear after prediction</p>
              <p className="max-w-sm text-sm text-muted">Collect the feature window, then press Predict SOH.</p>
            </GlassCard>}
      </div>

    </motion.div>
  )
}
