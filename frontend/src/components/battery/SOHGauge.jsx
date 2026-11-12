import { motion } from 'framer-motion'

export default function SOHGauge({ value = 0, size = 220, stroke = 16 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 80 ? '#16A34A' : pct >= 65 ? '#F59E0B' : '#EF4444'
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Predicted SOH ${pct.toFixed(1)} percent`}>
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
        <span className="font-poppins text-4xl font-extrabold text-ink">{pct.toFixed(1)}<span className="text-xl text-muted">%</span></span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Predicted SOH</span>
      </div>
    </div>
  )
}
