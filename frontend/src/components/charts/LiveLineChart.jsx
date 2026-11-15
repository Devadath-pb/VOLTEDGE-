import {
  ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { fmtTime } from '../../utils/format.js'

const GREEN = '#16A34A'
const DARK = '#14532D'

const chartTooltip = {
  background: 'rgba(255,255,255,0.92)',
  color: '#102A22',
  border: '1px solid rgba(255,255,255,0.98)',
  borderRadius: 14,
  boxShadow: '0 14px 32px rgba(21,128,61,0.16)',
  backdropFilter: 'blur(14px)',
  fontSize: 12,
}

export default function LiveLineChart({
  title, data, dataKey, xKey = 'timestamp', unit = '',
  color = GREEN, height = 260, domain, secondKey, secondColor = DARK, demo,
}) {
  if (!data?.length) return null
  const gradientId = `live-gradient-${dataKey.replace(/[^a-z0-9]/gi, '-')}`
  return (
    <div className="glass glass-hover p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="label-caps">Live signal</p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.035em] text-ink">{title}</h3>
        </div>
        <span className="rounded-full bg-lightmint px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-darkgreen">{unit}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.26} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 7" stroke="rgba(16,42,34,0.10)" />
            <XAxis
              dataKey={xKey}
              tickFormatter={(v) => fmtTime(typeof v === 'string' ? v : new Date(v).toISOString())}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={domain ?? ['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={54}
              unit={unit}
            />
            <Tooltip
              contentStyle={chartTooltip}
              cursor={{ stroke: color, strokeOpacity: 0.32, strokeDasharray: '4 4' }}
              labelFormatter={(v) => fmtTime(typeof v === 'string' ? v : new Date(v).toISOString())}
              formatter={(value, name) => [`${Number(value).toFixed(2)} ${unit}`, name]}
            />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area
              type="monotone" dataKey={dataKey} name={title.replace(/ vs Time/i, '')}
              stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false}
              isAnimationActive animationDuration={500}
              activeDot={{ r: 5, fill: '#fff', stroke: color, strokeWidth: 3 }}
            />
            {secondKey && (
              <Line
                type="monotone" dataKey={secondKey} name="Secondary"
                stroke={secondColor} strokeWidth={2} dot={false} strokeDasharray="5 4"
                isAnimationActive animationDuration={500}
              />
            )}
            {domain?.[0] != null && domain?.[1] != null && <ReferenceLine y={domain[0]} stroke="rgba(21,128,61,0.08)" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {demo && <p className="mt-2 text-right text-[10px] font-semibold uppercase tracking-wider text-amber-600">Simulated demo data</p>}
    </div>
  )
}
