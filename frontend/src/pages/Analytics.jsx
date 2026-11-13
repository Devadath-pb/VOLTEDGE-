import { motion } from 'framer-motion'
import { Database, Filter, Braces, Cpu, CheckCircle2, Loader2, Clock, Box, Play, Timer } from 'lucide-react'
import PageHeader from '../components/common/PageHeader.jsx'
import GlassCard from '../components/common/GlassCard.jsx'
import SOHGauge from '../components/battery/SOHGauge.jsx'
import { LoadingState, ErrorState, DemoBadge } from '../components/common/states.jsx'
import {
  DegradationChart, ActualVsPredictedChart, ForecastChart, FeatureImportanceChart,
} from '../components/charts/HistoricalChart.jsx'
import { useSOHPrediction } from '../hooks/useSOHPrediction.js'
import { useApp } from '../context/AppContext.jsx'
import { fmt, fmtDateTime, sohCategory } from '../utils/format.js'

const pipelineSteps = (p) => [
  { icon: Database, label: 'Data collection', state: p?.collection },
  { icon: Filter, label: 'Preprocessing', state: p?.preprocessing },
  { icon: Braces, label: 'Feature extraction', state: p?.featureExtraction },
  { icon: Cpu, label: 'ML inference', state: p?.inference },
  { icon: CheckCircle2, label: 'Prediction updated', state: p?.updated ? 'complete' : undefined },
]

function StepChip({ icon: Icon, label, state }) {
  const map = {
    complete: { cls: 'bg-mint text-darkgreen', icon: CheckCircle2, text: 'Complete' },
    running: { cls: 'bg-sky-100 text-sky-700', icon: Loader2, text: 'Running' },
    queued: { cls: 'bg-slate-100 text-slate-500', icon: Clock, text: 'Queued' },
    failed: { cls: 'bg-red-100 text-red-600', icon: Box, text: 'Failed' },
  }
  const m = map[state] ?? { cls: 'bg-slate-100 text-slate-500', icon: Clock, text: 'Waiting' }
  const StatusIcon = state ? m.icon : Icon
  return (
    <span className={`chip ${m.cls}`} title={label}>
      <StatusIcon className={`h-3.5 w-3.5 ${state === 'running' ? 'animate-spin' : ''}`} />
      {label} · {m.text}
    </span>
  )
}

export default function Analytics() {
  const { data, loading, error, predicting, predict } = useSOHPrediction()
  const { demoMode } = useApp()

  if (loading) return <div className="pt-8"><LoadingState label="Loading SOH prediction pipeline…" /></div>
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!data) return <ErrorState message="No prediction data returned by the backend." />

  const cat = sohCategory(data.predictedSoh)
  const hasUncertainty = data.uncertainty != null
  const hasReference = Array.isArray(data.actualVsPredicted) && data.actualVsPredicted.length > 0
  const hasForecast = Array.isArray(data.forecast) && data.forecast.length > 0
  const featureCollection = data.featureCollection ?? {}
  const featureValues = featureCollection.features ?? {}
  const featureColumns = data.featureColumns ?? []
  const measurementColumns = data.measurementColumns ?? ['voltage', 'current', 'temperature']
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
          <span className="chip bg-lightmint text-darkgreen"><Timer className="h-3.5 w-3.5" /> Features refresh 10s</span>
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
              ['Prediction timestamp', data.predictionAvailable ? fmtDateTime(data.predictionTimestamp ?? data.timestamp) : 'Not predicted yet'],
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

      {/* Prediction pipeline status */}
      <GlassCard className="mt-6">
        <h2 className="label-caps mb-4">Prediction Pipeline</h2>
        <div className="flex flex-wrap gap-2.5">
          {pipelineSteps(data.pipeline).map((s) => <StepChip key={s.label} {...s} />)}
        </div>
        <p className="mt-4 text-xs text-muted">
          States reflect actual backend processing. New readings update the feature window; inference runs only after a manual prediction request.
        </p>
      </GlassCard>

      {/* SOH graphs */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <DegradationChart data={data.degradation ?? []} />
        {hasReference
          ? <ActualVsPredictedChart data={data.actualVsPredicted} />
          : <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <Box className="h-10 w-10 text-primary/50" />
              <p className="font-semibold text-ink">Actual vs Predicted SOH</p>
              <p className="max-w-sm text-sm text-muted">
                Shown only when ground-truth reference measurements are available from the backend.
              </p>
            </GlassCard>}
        {hasForecast
          ? <ForecastChart history={data.degradation?.slice(-40)} forecast={data.forecast} />
          : <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <Box className="h-10 w-10 text-primary/50" />
              <p className="font-semibold text-ink">Future SOH Forecast</p>
              <p className="max-w-sm text-sm text-muted">
                Requires a deployed forecasting model. No forecast model is currently available.
              </p>
            </GlassCard>}
        {Array.isArray(data.featureImportance) && data.featureImportance.length > 0
          ? <FeatureImportanceChart data={data.featureImportance} />
          : <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <Box className="h-10 w-10 text-primary/50" />
              <p className="font-semibold text-ink">Feature Importance</p>
              <p className="max-w-sm text-sm text-muted">
                Not reported by the currently deployed model.
              </p>
            </GlassCard>}
      </div>

      {/* Model performance */}
      {data.metrics && (
        <div className="mt-6">
          <h2 className="mb-4 font-poppins text-lg font-bold text-ink">Model Performance</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'MAE', value: data.metrics.mae, suffix: '% SOH' },
              { label: 'RMSE', value: data.metrics.rmse, suffix: '% SOH' },
              { label: 'R² Score', value: data.metrics.r2, suffix: '' },
            ].map((m) => (
              <GlassCard key={m.label} className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.label}</p>
                <p className="mt-2 font-poppins text-3xl font-extrabold text-primary">{fmt(m.value, m.label === 'R² Score' ? 3 : 2)}</p>
                <p className="mt-1 text-xs text-muted">{m.suffix || 'coefficient of determination'}</p>
              </GlassCard>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Evaluation metrics are supplied by the backend training pipeline for the deployed model.
          </p>
        </div>
      )}
    </motion.div>
  )
}
