import { motion } from 'framer-motion'

export default function SOHGauge({ value = 0, size = 220, stroke = 16 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const hasValue = value != null && Number.isFinite(Number(value))
  const pct = hasValue ? Math.max(0, Math.min(100, Number(value))) : 0
  const color = pct >= 80 ? '#16A34A' : pct >= 65 ? '#F59E0B' : '#EF4444'
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={hasValue ? `Predicted SOH ${pct.toFixed(1)} percent` : 'SOH prediction not available'}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#DCFCE7" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-poppins text-4xl font-extrabold text-ink">{hasValue ? pct.toFixed(1) : '—'}{hasValue && <span className="text-xl text-muted">%</span>}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Predicted SOH</span>
      </div>
    </div>
  )
}
