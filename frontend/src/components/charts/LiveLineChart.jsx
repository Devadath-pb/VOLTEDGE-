import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { fmtTime } from '../../utils/format.js'

const GREEN = '#16A34A'
const DARK = '#14532D'

export default function LiveLineChart({
  title, data, dataKey, xKey = 'timestamp', unit = '',
  color = GREEN, height = 260, domain, secondKey, secondColor = DARK, demo,
}) {
  if (!data?.length) return null
  return (
    <div className="glass glass-hover p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <span className="text-xs font-semibold text-muted">{unit}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.12)" />
            <XAxis
              dataKey={xKey}
              tickFormatter={(v) => fmtTime(typeof v === 'string' ? v : new Date(v).toISOString())}
              tick={{ fontSize: 11, fill: '#64748B' }}
              stroke="rgba(22,163,74,0.25)"
              minTickGap={40}
            />
            <YAxis
              domain={domain ?? ['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748B' }}
              stroke="rgba(22,163,74,0.25)"
              width={54}
              unit={unit}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.9)', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(22,163,74,0.15)', fontSize: 12,
              }}
              labelFormatter={(v) => fmtTime(typeof v === 'string' ? v : new Date(v).toISOString())}
              formatter={(value, name) => [`${Number(value).toFixed(2)} ${unit}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone" dataKey={dataKey} name={title.replace(/ vs Time/i, '')}
              stroke={color} strokeWidth={2.5} dot={false}
              isAnimationActive animationDuration={500}
              activeDot={{ r: 4, fill: color }}
            />
            {secondKey && (
              <Line
                type="monotone" dataKey={secondKey} name="Secondary"
                stroke={secondColor} strokeWidth={2} dot={false} strokeDasharray="5 4"
                isAnimationActive animationDuration={500}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {demo && <p className="mt-2 text-right text-[10px] font-semibold uppercase tracking-wider text-amber-600">Simulated demo data</p>}
    </div>
  )
}
