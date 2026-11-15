import GlassCard from '../common/GlassCard.jsx'

export default function MetricCard({ icon: Icon, label, value, unit, trend, accent = 'text-primary', footnote }) {
  return (
    <GlassCard className="flex min-h-[146px] flex-col justify-between gap-4 !p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-line bg-white">
          <Icon className={accent} size={16} />
        </span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="tabular-nums text-3xl font-black tracking-[-0.06em] text-ink">{value}</span>
          {unit && <span className="text-xs font-bold text-muted">{unit}</span>}
        </div>
        {(trend || footnote) && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{trend && <span className={trend.startsWith('+') ? 'text-lime-dark' : 'text-amber-600'}>{trend} </span>}{footnote}</p>}
      </div>
    </GlassCard>
  )
}
