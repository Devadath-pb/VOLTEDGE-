import { motion } from 'framer-motion'
import { Zap, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { clamp } from '../../utils/format.js'

const stateMeta = {
  charging: { label: 'Charging', icon: ArrowUpRight, badge: 'bg-mint text-darkgreen' },
  discharging: { label: 'Discharging', icon: ArrowDownRight, badge: 'bg-amber-100 text-amber-700' },
  idle: { label: 'Idle', icon: Minus, badge: 'bg-slate-100 text-slate-600' },
}

export default function BatteryVisualization({ batteryPercentage, percentageSource, state = 'idle', soh }) {
  const hasPercentage = batteryPercentage != null
  const level = clamp(batteryPercentage ?? 0, 0, 100)
  const meta = stateMeta[state] ?? stateMeta.idle
  const Icon = meta.icon
  const levelColor = level > 50 ? 'from-lime to-lime-dark' : level > 20 ? 'from-amber-300 to-amber-500' : 'from-red-400 to-red-600'
  return (
    <div className="glass glass-hover relative flex min-h-[360px] flex-col gap-5 overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-lime-dark" /><span className="label-caps">Battery passport</span></div>
        <span className="font-mono text-[10px] font-bold text-muted">CELL / 01</span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-7">
        <div className="relative h-52 w-28 rounded-[18px] border-2 border-green-900/30 bg-white/80 p-1.5 shadow-[0_14px_28px_rgba(21,128,61,0.12)]">
          <div className="absolute -top-3 left-1/2 h-3 w-10 -translate-x-1/2 rounded-t-[5px] bg-green-900/60" />
          <div className="relative h-full w-full overflow-hidden rounded-[12px] bg-green-50">
            {hasPercentage && <motion.div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t ${levelColor}`} initial={false} animate={{ height: `${level}%` }} transition={{ type: 'spring', stiffness: 60, damping: 14 }} />}
            <div className="absolute inset-0 flex items-center justify-center"><span className="tabular-nums text-3xl font-black text-ink">{hasPercentage ? level.toFixed(0) : '—'}{hasPercentage && <span className="text-base">%</span>}</span></div>
          </div>
        </div>
        <div className="space-y-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">Reported SOC</p><p className="mt-1 tabular-nums text-4xl font-black tracking-[-0.07em] text-ink">{hasPercentage ? `${level.toFixed(1)}%` : '—'}</p></div>
          {soh != null && <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">SOH</p><p className="mt-1 tabular-nums text-lg font-black text-lime-dark">{soh.toFixed(1)}%</p></div>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className={`chip ${meta.badge}`}><Icon className="h-3.5 w-3.5" /> {meta.label}</div>
        <span className="text-right text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{percentageSource === 'device' || percentageSource === 'coulomb-counted' ? 'ESP32 reported' : hasPercentage ? 'Device value' : 'Awaiting SOC'}</span>
      </div>
    </div>
  )
}
