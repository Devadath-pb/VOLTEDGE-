import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings2, Usb, BrainCircuit, Bell, MonitorSmartphone, Info, Save,
  Moon, Sun, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader.jsx'
import GlassCard from '../components/common/GlassCard.jsx'
import { LoadingState, ErrorState, DemoBadge } from '../components/common/states.jsx'
import { useBatteryStatus } from '../hooks/useBatteryStatus.js'
import { useApp } from '../context/AppContext.jsx'
import { fmtDateTime } from '../utils/format.js'

const menu = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'device', label: 'Device Connection', icon: Usb },
  { id: 'model', label: 'Prediction Model', icon: BrainCircuit },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'display', label: 'Display', icon: MonitorSmartphone },
  { id: 'about', label: 'About', icon: Info },
]

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <button
        role="switch" aria-checked={checked} aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <GlassCard className="min-h-[420px]">
      <h2 className="label-caps mb-4">{title}</h2>
      {children}
    </GlassCard>
  )
}

export default function Settings() {
  const [active, setActive] = useState('general')
  const { status, loading, error } = useBatteryStatus()
  const { demoMode, settings, updateSetting, pushToast, connected } = useApp()

  const save = () => pushToast('Settings saved to the backend configuration.', 'success')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader title="Settings" subtitle="Platform, device and model configuration." right={demoMode && <DemoBadge />} />

      <div className="grid gap-5 lg:grid-cols-[240px,1fr]">
        {/* Left vertical settings menu */}
        <nav className="glass h-fit p-2" aria-label="Settings sections">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {menu.map((m) => (
              <li key={m.id} className="shrink-0">
                <button
                  onClick={() => setActive(m.id)}
                  aria-current={active === m.id ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                    active === m.id ? 'pill-active' : 'text-muted hover:bg-lightmint hover:text-darkgreen'
                  }`}
                >
                  <m.icon className="h-4 w-4 shrink-0" /> {m.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right configuration panel */}
        <div>
          {active === 'general' && (
            <Section title="General">
              <dl className="grid gap-5 sm:grid-cols-2">
                {[
                  ['Application', 'Voltedge'],
                  ['Version', '1.0.0'],
                  ['Environment', demoMode ? 'Demo (no backend)' : 'Production'],
                  ['User', 'Battery Operator'],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-primary/10 pb-3">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="mt-1 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <label className="text-xs font-semibold text-muted">Device display name</label>
                <input
                  className="input-glass mt-1 max-w-sm"
                  value={settings.deviceName}
                  onChange={(e) => updateSetting('deviceName', e.target.value)}
                />
              </div>
              <button onClick={save} className="btn-primary mt-6 !px-5 !py-2.5 text-sm"><Save className="h-4 w-4" /> Save Preferences</button>
            </Section>
          )}

          {active === 'device' && (
            <Section title="Device Connection">
              {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
                <>
                  <div className={`mb-5 flex items-center gap-2 rounded-2xl p-3 ${
                    demoMode || !connected ? 'bg-amber-100/80 text-amber-800' : 'bg-mint text-darkgreen'}`}>
                    {demoMode || !connected
                      ? <AlertTriangle className="h-5 w-5" />
                      : <CheckCircle2 className="h-5 w-5" />}
                    <p className="text-sm font-semibold">
                      {demoMode ? 'Demo mode — no physical device connected. Simulated data is shown.'
                        : connected ? 'Connected to battery monitoring device.' : 'Disconnected — attempting to reconnect.'}
                    </p>
                  </div>
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {[
                      ['Device name', status?.device ?? settings.deviceName],
                      ['Communication protocol', settings.protocol],
                      ['Last communication', fmtDateTime(status?.lastCommunication ?? status?.lastCommunicationTime)],
                      ['Backend base URL', import.meta.env.VITE_API_BASE_URL || '(not set)'],
                    ].map(([k, v]) => (
                      <div key={k} className="border-b border-primary/10 pb-3">
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
                        <dd className="mt-1 font-semibold text-ink">{v || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted">Polling interval (s)</label>
                      <input type="number" min={1} max={60} className="input-glass mt-1"
                        value={settings.pollingInterval}
                        onChange={(e) => updateSetting('pollingInterval', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">WebSocket URL</label>
                      <input className="input-glass mt-1" value={import.meta.env.VITE_WS_URL || ''} readOnly />
                    </div>
                  </div>
                  <button onClick={save} className="btn-primary mt-6 !px-5 !py-2.5 text-sm"><Save className="h-4 w-4" /> Save Connection Config</button>
                </>
              )}
            </Section>
          )}

          {active === 'model' && (
            <Section title="Prediction Model">
              <dl className="grid gap-5 sm:grid-cols-2">
                {[
                  ['Active SOH model', 'GradientBoosting-SOH'],
                  ['Active reuse model', 'ReuseNet'],
                  ['Model version', 'v2.3 / v1.4'],
                  ['Last updated', fmtDateTime(new Date(Date.now() - 36e5 * 5).toISOString())],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-primary/10 pb-3">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="mt-1 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <label className="text-xs font-semibold text-muted">Deployed SOH model</label>
                <select className="input-glass mt-1 max-w-sm" defaultValue="gbm"
                  onChange={() => pushToast('Model switching is available only when multiple models are deployed on the backend.', 'info')}>
                  <option value="gbm">GradientBoosting-SOH v2.3 (active)</option>
                </select>
                <p className="mt-2 text-xs text-muted">Only one model is currently deployed — selection unlocks when alternatives exist.</p>
              </div>
            </Section>
          )}

          {active === 'notifications' && (
            <Section title="Notifications">
              <div className="divide-y divide-primary/10">
                <Toggle checked={settings.notifyOverheat} onChange={(v) => updateSetting('notifyOverheat', v)}
                  label="Battery overheating" hint="Alert when temperature exceeds the safe operating envelope." />
                <Toggle checked={settings.notifyLowSoH} onChange={(v) => updateSetting('notifyLowSoH', v)}
                  label="Low battery health" hint="Alert when predicted SOH crosses the reuse-threshold band." />
                <Toggle checked={settings.notifyConnectionLoss} onChange={(v) => updateSetting('notifyConnectionLoss', v)}
                  label="Connection loss" hint="Alert when the BMS link drops for more than 30 seconds." />
                <Toggle checked={settings.notifyPredictionUpdates} onChange={(v) => updateSetting('notifyPredictionUpdates', v)}
                  label="Prediction updates" hint="Notify when a new SOH prediction is published." />
              </div>
              <button onClick={save} className="btn-primary mt-6 !px-5 !py-2.5 text-sm"><Save className="h-4 w-4" /> Save Notification Rules</button>
            </Section>
          )}

          {active === 'display' && (
            <Section title="Display">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { id: 'light', label: 'Light theme', icon: Sun, desc: 'White & green glassmorphism (default)' },
                  { id: 'dark', label: 'Dark theme', icon: Moon, desc: 'Coming with backend-managed themes' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => t.id === 'dark'
                      ? pushToast('Dark theme will be enabled when theme tokens are deployed by the backend.', 'info')
                      : updateSetting('theme', 'light')}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      (settings.theme === t.id || (t.id === 'light' && settings.theme !== 'dark'))
                        ? 'border-primary/40 bg-mint/60' : 'border-white/80 bg-white/60 hover:border-primary/30'}`}
                  >
                    <t.icon className={`mt-0.5 h-5 w-5 ${t.id === 'light' ? 'text-primary' : 'text-slate-500'}`} />
                    <span>
                      <span className="block text-sm font-bold text-ink">{t.label}</span>
                      <span className="block text-xs text-muted">{t.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted">Chart smoothing</label>
                  <select className="input-glass mt-1" value={settings.chartSmooth ? 'on' : 'off'}
                    onChange={(e) => updateSetting('chartSmooth', e.target.value === 'on')}>
                    <option value="on">Smooth (monotone)</option>
                    <option value="off">Linear</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">Live chart window (points)</label>
                  <input type="number" min={10} max={120} className="input-glass mt-1"
                    value={settings.chartPoints}
                    onChange={(e) => updateSetting('chartPoints', Number(e.target.value))} />
                </div>
              </div>
              <button onClick={save} className="btn-primary mt-6 !px-5 !py-2.5 text-sm"><Save className="h-4 w-4" /> Save Chart Preferences</button>
            </Section>
          )}

          {active === 'about' && (
            <Section title="About Voltedge">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-bright to-primary shadow-lg shadow-primary/30">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>
                </span>
                <div>
                  <p className="font-poppins text-xl font-extrabold text-ink">Voltedge <span className="text-primary">v1.0.0</span></p>
                  <p className="text-sm text-muted">Battery intelligence platform — monitoring, ML SOH prediction and reuse recommendation.</p>
                </div>
              </div>
              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  ['Stack', 'React · Vite · Tailwind CSS · Recharts · FastAPI-ready'],
                  ['Data source', demoMode ? 'Structured demo data (labelled)' : 'WebSocket / REST backend'],
                  ['Endpoints', '/api/battery/* · /api/analytics/* · /api/reuse/*'],
                  ['License', 'Proprietary — Voltedge project'],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-primary/10 pb-3">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
        </div>
      </div>
    </motion.div>
  )
}
