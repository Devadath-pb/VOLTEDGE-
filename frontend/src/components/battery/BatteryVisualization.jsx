import { motion } from 'framer-motion'
import { Zap, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { clamp } from '../../utils/format.js'

const stateMeta = {
  charging: { label: 'Charging', icon: ArrowUpRight, color: 'text-primary', ring: 'ring-primary/40' },
  discharging: { label: 'Discharging', icon: ArrowDownRight, color: 'text-amber-600', ring: 'ring-amber-400/40' },
  idle: { label: 'Idle', icon: Minus, color: 'text-muted', ring: 'ring-slate-300' },
}

export default function BatteryVisualization({ soc, state = 'idle', soh }) {
  const level = clamp(soc ?? 0, 0, 100)
  const meta = stateMeta[state] ?? stateMeta.idle
  const Icon = meta.icon
  const levelColor = level > 50 ? 'from-bright to-primary' : level > 20 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500'
  return (
    <div className="glass glass-hover flex flex-col items-center gap-5 p-8">
      <div className="flex items-center gap-2 self-start">
        <Zap className="h-4 w-4 text-primary" />
        <span className="label-caps">Battery Overview</span>
      </div>

      <div className={`relative h-56 w-32 rounded-2xl border-4 border-ink/70 bg-white/60 p-1.5 ring-4 ${meta.ring}`}>
        <div className="absolute -top-2.5 left-1/2 h-3 w-12 -translate-x-1/2 rounded-t-md bg-ink/70" />
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-lightmint/60">
          <motion.div
            className={`absolute bottom-0 left-0 w-full rounded-lg bg-gradient-to-t ${levelColor}`}
            initial={false}
            animate={{ height: `${level}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          >
            <motion.div
              className="absolute inset-x-0 top-0 h-1 bg-white/60"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-poppins text-3xl font-extrabold text-ink drop-shadow-sm">
              {level.toFixed(0)}<span className="text-lg">%</span>
            </span>
          </div>
        </div>
      </div>

      <div className={`chip ${state === 'charging' ? 'bg-mint text-darkgreen' : state === 'discharging' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
        <Icon className="h-3.5 w-3.5" /> {meta.label}
      </div>
      {soh != null && (
        <p className="text-xs font-semibold text-muted">
          State of Health <span className="text-darkgreen">{soh.toFixed(1)}%</span>
        </p>
      )}
    </div>
  )
}
