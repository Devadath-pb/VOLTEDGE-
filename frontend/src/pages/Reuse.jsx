import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, ListChecks, Thermometer, Zap, Info } from 'lucide-react'
import PageHeader from '../components/common/PageHeader.jsx'
import GlassCard from '../components/common/GlassCard.jsx'
import RecommendationCard from '../components/recommendations/RecommendationCard.jsx'
import { LoadingState, ErrorState, DemoBadge } from '../components/common/states.jsx'
import { useReuseRecommendations } from '../hooks/useReuseRecommendations.js'
import { useApp } from '../context/AppContext.jsx'

function DetailPanel({ rec, onClose }) {
  const sections = [
    { title: 'Why this application is recommended', items: [rec.explanation], icon: Info, single: true },
    { title: 'Supporting battery characteristics', items: rec.supporting, icon: CheckCircle2 },
    { title: 'Advantages', items: rec.advantages, icon: CheckCircle2 },
    { title: 'Limitations', items: rec.limitations, icon: AlertTriangle },
    { title: 'Required operating conditions', items: rec.conditions, icon: ListChecks },
  ].filter((s) => s.items?.length && !(s.items.length === 1 && (s.items[0] === '—' || !s.items[0])))

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="glass-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-glass p-6 sm:rounded-glass"
          onClick={(e) => e.stopPropagation()}
          role="dialog" aria-modal="true" aria-label={`${rec.name} details`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-poppins text-2xl font-bold text-ink">{rec.name}</h2>
              <span className="chip mt-1 bg-lightmint text-darkgreen">{rec.category} · suitability {(rec.score * 100).toFixed(0)}/100</span>
            </div>
            <button onClick={onClose} aria-label="Close details" className="rounded-full border border-white/80 bg-white/70 p-2 text-muted hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            {sections.map((s) => (
              <div key={s.title}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-darkgreen">
                  <s.icon className="h-4 w-4 text-primary" /> {s.title}
                </h3>
                {s.single ? (
                  <p className="text-sm leading-relaxed text-muted">{s.items[0]}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {s.items.map((it, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {it}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className={`rounded-2xl border p-4 ${
              rec.safety.status === 'passed' ? 'border-primary/30 bg-mint/50'
              : rec.safety.status === 'conditional' ? 'border-amber-200 bg-amber-50/80'
              : 'border-red-200 bg-red-50/80'}`}>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-ink">
                <AlertTriangle className={`h-4 w-4 ${rec.safety.status === 'passed' ? 'text-primary' : rec.safety.status === 'conditional' ? 'text-amber-600' : 'text-red-500'}`} />
                Safety Assessment
              </h3>
              <p className="text-sm leading-relaxed text-ink/80">{rec.safety.note}</p>
              <p className="mt-2 text-xs italic text-muted">
                Reuse is never recommended based on SOH alone — physical and electrical inspection data is required for a safety sign-off.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Reuse() {
  const { recommendations, loading, error, getDetails } = useReuseRecommendations()
  const { demoMode, pushToast } = useApp()
  const [selected, setSelected] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const openDetails = async (rec) => {
    setLoadingDetails(true)
    try {
      const full = await getDetails(rec.id)
      setSelected(full ?? rec)
    } finally {
      setLoadingDetails(false)
    }
  }

  if (loading) return <div className="pt-8"><LoadingState label="Loading reuse recommendations…" /></div>
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!recommendations?.length) return <ErrorState message="The recommendation model returned no applications." />

  const best = recommendations[0]
  const alternatives = recommendations.slice(1)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Battery Reuse Recommendation"
        subtitle="Second-life application scoring powered by a dedicated ML model — SOH, capacity, voltage, thermal behaviour and cycle history."
        right={<>{demoMode && <DemoBadge />}
          <span className="chip bg-mint text-darkgreen"><Zap className="h-3.5 w-3.5" /> Model: ReuseNet v1.4</span>
          <span className="chip bg-lightmint text-darkgreen"><Thermometer className="h-3.5 w-3.5" /> Thermal profile OK</span></>}
      />

      <div className="mb-6 rounded-glass border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 backdrop-blur" role="note">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Safety rule:</strong> recommendations combine electrical, thermal and cycle-history screening, but a physical
            cell inspection is still required before any reuse. Applications marked “insufficient safety data” need additional
            testing and must not be deployed.
          </span>
        </p>
      </div>

      <h2 className="label-caps mb-4">Best Match</h2>
      <RecommendationCard rec={best} featured onViewDetails={openDetails} active={selected?.id === best.id} />
      {loadingDetails && <p className="mt-2 text-xs text-muted">Loading full assessment…</p>}

      <h2 className="label-caps mb-4 mt-10">Alternative Applications</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} onViewDetails={openDetails} active={selected?.id === rec.id} />
        ))}
      </div>

      {selected && <DetailPanel rec={selected} onClose={() => setSelected(null)} />}
    </motion.div>
  )
}
