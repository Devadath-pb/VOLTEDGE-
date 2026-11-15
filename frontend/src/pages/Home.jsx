import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, BrainCircuit, Recycle, Gauge, Repeat, Thermometer, Wifi, ArrowRight } from 'lucide-react'
import GlassCard from '../components/common/GlassCard.jsx'
import { useBatteryLiveData } from '../hooks/useBatteryLiveData.js'
import { fmt } from '../utils/format.js'
import { useApp } from '../context/AppContext.jsx'
import { DemoBadge } from '../components/common/states.jsx'

const features = [
  { icon: Activity, title: 'Live Monitoring', text: 'Track voltage, current, temperature and SOC in real time from your connected BMS.' },
  { icon: BrainCircuit, title: 'SOH Prediction', text: 'Machine learning-powered battery health estimation with automatic feature extraction.' },
  { icon: Recycle, title: 'Reuse Recommendation', text: 'Identify suitable second-life applications with safety-aware scoring.' },
]

export default function Home() {
  const { live } = useBatteryLiveData(1)
  const { demoMode } = useApp()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="label-caps">Smart Battery Platform</span>
          <h1 className="mt-4 font-poppins text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Battery Health Monitoring <span className="text-primary">&amp; Reuse System</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Real-time battery monitoring, intelligent SOH prediction and second-life recommendations
            for a sustainable battery lifecycle.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="btn-primary">Get Started <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/analytics" className="btn-secondary">View Dashboard</Link>
          </div>
          {demoMode && <div className="mt-5"><DemoBadge /></div>}
        </div>

        {/* Battery hero visual */}
        <div className="relative flex items-center justify-center" aria-hidden="true">
          <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-mint to-lightmint sm:h-96 sm:w-96" />
          <div className="absolute h-56 w-56 rounded-full border-2 border-dashed border-primary/25 sm:h-72 sm:w-72" />
          <div className="absolute h-40 w-40 rounded-full border border-primary/15" />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="relative h-64 w-36 rounded-3xl border-[6px] border-ink/70 bg-white/70 p-2 shadow-glass-lg backdrop-blur">
              <div className="absolute -top-3.5 left-1/2 h-4 w-16 -translate-x-1/2 rounded-t-lg bg-ink/70" />
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-lightmint/70">
                <motion.div
                  className="absolute bottom-0 w-full rounded-xl bg-gradient-to-t from-primary to-bright"
                  initial={{ height: '30%' }}
                  animate={{ height: ['30%', '82%', '30%'] }}
                  transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="h-10 w-10 text-darkgreen/70" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-16 grid gap-5 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <GlassCard className="flex h-full flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint">
                <f.icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="font-poppins text-lg font-bold text-ink">{f.title}</h3>
              <p className="text-sm text-muted">{f.text}</p>
            </GlassCard>
          </motion.div>
        ))}
      </section>

      {/* Overview metrics */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-poppins text-xl font-bold text-ink">Overview</h2>
          {demoMode && <span className="text-xs font-semibold text-amber-600">Illustrative placeholders — backend not connected</span>}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Gauge, label: 'Battery Health', value: live ? `${fmt(live.soh, 1)}%` : '—' },
            { icon: Repeat, label: 'Total Cycles', value: live ? live.cycleCount : '—' },
            { icon: Thermometer, label: 'Temperature', value: live ? `${fmt(live.temperature, 1)} °C` : '—' },
            { icon: Wifi, label: 'Connection', value: demoMode ? 'Demo' : 'BMS' },
          ].map((m) => (
            <GlassCard key={m.label} className="flex items-center gap-3 !p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lightmint">
                <m.icon className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{m.label}</p>
                <p className="font-poppins text-lg font-bold text-ink">{m.value}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </motion.div>
  )
}
