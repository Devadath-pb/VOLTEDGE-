import GlassCard from '../common/GlassCard.jsx'
import { Sun, Home, Factory, Bike, ArrowRight, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'

const iconMap = { Sun, Home, Factory, Bike }
const safetyMeta = {
  passed: { icon: ShieldCheck, label: 'Screening passed', cls: 'bg-mint text-darkgreen' },
  conditional: { icon: ShieldQuestion, label: 'Additional testing required', cls: 'bg-amber-100 text-amber-700' },
  insufficient: { icon: ShieldAlert, label: 'Insufficient safety data', cls: 'bg-red-100 text-red-600' },
}

export default function RecommendationCard({ rec, featured = false, onViewDetails, active }) {
  const Icon = iconMap[rec.icon] ?? Sun
  const safety = safetyMeta[rec.safety?.status] ?? safetyMeta.insufficient
  const SafetyIcon = safety.icon
  return (
    <GlassCard
      className={`flex flex-col gap-4 ${featured ? 'lg:col-span-2' : ''} ${active ? '!border-primary/50 ring-2 ring-primary/25' : ''}`}
      role="article"
      aria-label={rec.name}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-lightmint">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className={`font-bold text-ink ${featured ? 'text-xl' : 'text-base'}`}>{rec.name}</h3>
            <span className="chip mt-1 bg-lightmint text-darkgreen">{rec.category}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-poppins text-2xl font-extrabold text-primary">{(rec.score * 100).toFixed(0)}</span>
          <span className="text-xs font-semibold text-muted">/100 suitability</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-mint/70">
        <div className="h-full rounded-full bg-gradient-to-r from-bright to-primary" style={{ width: `${rec.score * 100}%` }} />
      </div>

      <p className={`text-sm text-muted ${featured ? '' : 'line-clamp-2'}`}>{rec.summary}</p>

      <div className={`chip ${safety.cls}`}>
        <SafetyIcon className="h-3.5 w-3.5" /> {safety.label}
      </div>

      <button onClick={() => onViewDetails(rec)} className={featured ? 'btn-primary self-start' : 'btn-secondary self-start !px-5 !py-2 text-xs'}>
        View Details <ArrowRight className="h-4 w-4" />
      </button>
    </GlassCard>
  )
}
