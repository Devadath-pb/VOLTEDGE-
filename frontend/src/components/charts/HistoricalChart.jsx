import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, Cell, ComposedChart, Scatter,
} from 'recharts'
import { fmtDateTime } from '../../utils/format.js'

const tooltipStyle = {
  background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.9)', borderRadius: 12,
  boxShadow: '0 8px 24px rgba(22,163,74,0.15)', fontSize: 12,
}
const axis = { fontSize: 11, fill: '#64748B' }

function Frame({ title, subtitle, children, height = 300 }) {
  return (
    <div className="glass glass-hover p-5">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {subtitle && <p className="mb-3 mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  )
}

export function DegradationChart({ data }) {
  return (
    <Frame title="SOH Degradation Trend" subtitle="Model-estimated health across observed battery cycles">
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.12)" />
        <XAxis dataKey="cycle" tick={axis} stroke="rgba(22,163,74,0.25)" label={{ value: 'Cycle', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#64748B' }} />
        <YAxis domain={[50, 105]} tick={axis} stroke="rgba(22,163,74,0.25)" width={44} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="soh" name="Measured SOH (when available)" stroke="#14532D" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="predicted" name="Model estimate" stroke="#16A34A" strokeWidth={2} dot={false} strokeDasharray="6 4" />
      </LineChart>
    </Frame>
  )
}

export function ActualVsPredictedChart({ data }) {
  return (
    <Frame title="Actual vs Predicted SOH" subtitle="Shown only where ground-truth reference measurements exist">
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.12)" />
        <XAxis dataKey="cycle" tick={axis} stroke="rgba(22,163,74,0.25)" />
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={axis} stroke="rgba(22,163,74,0.25)" width={44} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${Number(v).toFixed(2)}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="actual" name="Actual SOH" stroke="#14532D" strokeWidth={2.5} dot={{ r: 2 }} />
        <Line type="monotone" dataKey="predicted" name="Predicted SOH" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 2 }} />
      </LineChart>
    </Frame>
  )
}

export function ForecastChart({ history, forecast }) {
  const merged = [...(history ?? []), ...(forecast ?? [])]
  return (
    <Frame title="Future SOH Forecast" subtitle="Dashed section = estimated future degradation, not measured data">
      <ComposedChart data={merged} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.12)" />
        <XAxis dataKey="cycle" tick={axis} stroke="rgba(22,163,74,0.25)" />
        <YAxis domain={[50, 105]} tick={axis} stroke="rgba(22,163,74,0.25)" width={44} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="soh" name="Historical (measured)" stroke="#14532D" fill="rgba(20,83,45,0.08)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="predicted" name="Model fit" stroke="#16A34A" strokeWidth={1.5} dot={false} strokeDasharray="4 4" connectNulls />
        <Line type="monotone" dataKey="soh" name="Forecast (estimated)" stroke="#22C55E" strokeWidth={2.5} dot={false} strokeDasharray="7 5" connectNulls />
      </ComposedChart>
    </Frame>
  )
}

export function FeatureImportanceChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,
    featureLabel: item.feature.replaceAll('_', ' '),
    importancePercent: item.importancePercent ?? (Number(item.importance ?? 0) * 100),
  }))
  return (
    <Frame title="Feature Importance" subtitle="Recalculated from the deployed Random Forest model" height={380}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.12)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} unit="%" tick={axis} stroke="rgba(22,163,74,0.25)" />
        <YAxis type="category" dataKey="featureLabel" width={170} tick={{ ...axis, fontSize: 10 }} stroke="rgba(22,163,74,0.25)" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(3)}%`, 'Importance']} />
        <Bar dataKey="importancePercent" radius={[0, 8, 8, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#16A34A' : '#86EFAC'} />)}
        </Bar>
      </BarChart>
    </Frame>
  )
}

export function ParameterHistoryChart({ title, data, dataKey, unit, color = '#16A34A', xKey = 'timestamp', area }) {
  const Comp = area ? AreaChart : LineChart
  return (
    <Frame title={title} height={240}>
      <Comp data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.12)" />
        <XAxis dataKey={xKey} tickFormatter={fmtDateTime} tick={axis} stroke="rgba(22,163,74,0.25)" minTickGap={60} />
        <YAxis tick={axis} stroke="rgba(22,163,74,0.25)" width={50} unit={unit} domain={['auto', 'auto']} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDateTime} formatter={(v) => [`${Number(v).toFixed(2)} ${unit}`, title]} />
        {area
          ? <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`${color}22`} dot={false} />
          : <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />}
      </Comp>
    </Frame>
  )
}
