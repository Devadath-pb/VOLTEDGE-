import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { fmtTime } from '../../utils/format.js'

const GREEN = '#6B8D12'
const DARK = '#17211B'

export default function LiveLineChart({
  title, data, dataKey, xKey = 'timestamp', unit = '',
  color = GREEN, height = 260, domain, secondKey, secondColor = DARK, demo,
}) {
  if (!data?.length) return null
  return (
    <div className="glass glass-hover p-5">
      <div className="mb-4 flex items-end justify-between border-b border-ink/10 pb-3">
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-ink">{title}</h3>
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">{unit}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 5" stroke="rgba(23,33,27,0.10)" />
            <XAxis
              dataKey={xKey}
              tickFormatter={(v) => fmtTime(typeof v === 'string' ? v : new Date(v).toISOString())}
              tick={{ fontSize: 11, fill: '#64748B' }}
              stroke="rgba(23,33,27,0.18)"
              minTickGap={40}
            />
            <YAxis
              domain={domain ?? ['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748B' }}
              stroke="rgba(23,33,27,0.18)"
              width={54}
              unit={unit}
            />
            <Tooltip
              contentStyle={{
                background: '#17211B', color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                boxShadow: '0 12px 24px rgba(13,21,17,0.18)', fontSize: 12,
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
