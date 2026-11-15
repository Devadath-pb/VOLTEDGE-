import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, BrainCircuit, Gauge, Recycle, Repeat, Thermometer, Wifi, Zap } from 'lucide-react'
import GlassCard from '../components/common/GlassCard.jsx'
import { useBatteryLiveData } from '../hooks/useBatteryLiveData.js'
import { fmt } from '../utils/format.js'
import { useApp } from '../context/AppContext.jsx'
import { DemoBadge } from '../components/common/states.jsx'

const features = [
  { icon: Activity, title: 'Live board', text: 'A clean operating view for voltage, current, temperature and device-reported SOC.' },
  { icon: BrainCircuit, title: 'SOH signal', text: 'Run your trained model when you need a health estimate, with the inputs kept visible.' },
  { icon: Recycle, title: 'Second life', text: 'Turn battery evidence into a cautious, explainable reuse shortlist.' },
]

function BoardRow({ label, value, unit, active }) {
  return <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 border-b border-ink/10 py-3 last:border-0"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">{label}</span><span className={`tabular-nums text-2xl font-black tracking-[-0.06em] ${active ? 'text-lime-dark' : 'text-ink'}`}>{value}</span><span className="text-[10px] font-bold uppercase text-muted">{unit}</span></div>
}

export default function Home() {
  const { live, source } = useBatteryLiveData(1)
  const { demoMode } = useApp()
  const liveLabel = source === 'live' ? 'Live telemetry' : source === 'demo' ? 'Demo stream' : 'Awaiting device'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <section className="grid items-stretch gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="flex flex-col justify-center py-4 lg:py-12">
          <div className="mb-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted"><span className="h-2 w-2 rounded-full bg-lime-dark" /> Battery intelligence / operator view</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.075em] text-ink sm:text-7xl">Know the battery before you decide its next life.</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg">Voltedge turns live ESP32 telemetry into a clear operating picture, on-demand SOH prediction and safer second-life decisions.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link to="/dashboard" className="btn-primary">Open live board <ArrowRight size={16} /></Link><Link to="/analytics" className="btn-secondary">Review health signal</Link></div>
          {demoMode && <div className="mt-5"><DemoBadge /></div>}
        </div>

        <div className="relative overflow-hidden rounded-[14px] bg-deep p-5 text-white shadow-[0_24px_60px_rgba(13,21,17,0.2)] sm:p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-lime/20" />
          <div className="relative flex items-start justify-between border-b border-white/15 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Live battery board</p><p className="mt-2 text-xl font-black tracking-[-0.04em]">Cell 01 / primary pack</p></div><div className="chip bg-white/10 text-lime"><span className="h-1.5 w-1.5 rounded-full bg-lime volt-live-dot" /> {liveLabel}</div></div>
          <div className="relative py-3"><BoardRow label="Voltage" value={live ? fmt(live.voltage) : '—'} unit="V" active /><BoardRow label="Current" value={live ? fmt(live.current) : '—'} unit="A" /><BoardRow label="Temperature" value={live ? fmt(live.temperature, 1) : '—'} unit="°C" /><BoardRow label="State of charge" value={live?.batteryPercentage != null ? fmt(live.batteryPercentage, 1) : '—'} unit="%" active /></div>
          <div className="relative mt-4 flex items-center justify-between border-t border-white/15 pt-5 text-[10px] font-black uppercase tracking-[0.14em] text-white/45"><span><Zap size={13} className="mr-1 inline text-lime" /> ESP32 / cloud link</span><span>{live?.state ?? 'idle'}</span></div>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-3">{features.map((feature, index) => <motion.div key={feature.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}><GlassCard className="flex h-full flex-col gap-4 !p-6"><span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-ink text-lime"><feature.icon size={18} /></span><h2 className="text-lg font-black tracking-[-0.03em] text-ink">{feature.title}</h2><p className="text-sm leading-6 text-muted">{feature.text}</p><Link to={index === 0 ? '/dashboard' : index === 1 ? '/analytics' : '/reuse'} className="mt-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-lime-dark">Open view <ArrowRight size={14} /></Link></GlassCard></motion.div>)}</section>

      <section className="mt-16"><div className="mb-4 flex items-end justify-between border-b border-ink/10 pb-3"><div><p className="label-caps">Current flight plan</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-ink">One source of truth for the next decision.</h2></div><Link to="/history" className="hidden text-xs font-black uppercase tracking-[0.12em] text-lime-dark sm:block">Open history <ArrowRight size={14} className="ml-1 inline" /></Link></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ icon: Gauge, label: 'Battery health', value: live ? `${fmt(live.soh, 1)}%` : '—' }, { icon: Repeat, label: 'Total cycles', value: live?.cycleCount ?? '—' }, { icon: Thermometer, label: 'Temperature', value: live ? `${fmt(live.temperature, 1)}°C` : '—' }, { icon: Wifi, label: 'Connection', value: demoMode ? 'Demo' : source === 'live' ? 'Live' : 'Offline' }].map((metric) => <GlassCard key={metric.label} className="!p-4"><metric.icon size={16} className="text-lime-dark" /><p className="mt-5 text-[10px] font-black uppercase tracking-[0.13em] text-muted">{metric.label}</p><p className="mt-1 text-xl font-black tracking-[-0.05em] text-ink">{metric.value}</p></GlassCard>)}</div></section>
    </motion.div>
  )
}
