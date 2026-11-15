import GlassCard from '../common/GlassCard.jsx'

export default function MetricCard({ icon: Icon, label, value, unit, trend, accent = 'text-primary', footnote }) {
  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint">
          <Icon className={`h-4.5 w-4.5 ${accent}`} size={18} />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-poppins text-3xl font-bold text-ink">{value}</span>
        {unit && <span className="text-sm font-semibold text-muted">{unit}</span>}
      </div>
      {(trend || footnote) && (
        <p className="text-xs text-muted">
          {trend && <span className={trend.startsWith('+') ? 'text-primary' : 'text-amber-600'}>{trend} </span>}
          {footnote}
        </p>
      )}
    </GlassCard>
  )
}
