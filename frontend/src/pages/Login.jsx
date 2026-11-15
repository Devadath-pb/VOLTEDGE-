import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { configured, user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!configured) return <Navigate to="/" replace />
  if (user) return <Navigate to={location.state?.from ?? '/dashboard'} replace />

  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError('')
    try { await signIn(email, password); navigate('/dashboard', { replace: true }) } catch (err) { setError(err.message || 'Unable to sign in') } finally { setSubmitting(false) }
  }

  return <main className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1fr,420px]">
    <section className="hidden lg:block"><div className="mb-7 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted"><span className="h-2 w-2 rounded-full bg-lime-dark" /> Private operator workspace</div><h1 className="max-w-2xl text-6xl font-black leading-[0.93] tracking-[-0.075em] text-ink">Your battery data stays on your board.</h1><p className="mt-6 max-w-lg text-base leading-7 text-muted">Sign in to see the devices and readings assigned to your Voltedge account.</p></section>
    <form onSubmit={submit} className="glass-strong p-7 sm:p-9"><div className="mb-8 flex items-center gap-3"><span className="brand-mark"><Zap size={20} fill="currentColor" /></span><div><p className="brand-name !text-ink">VOLTEDGE</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Battery intelligence</p></div></div><div className="mb-7"><p className="label-caps">Workspace access</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-ink">Sign in to continue</h2></div><label className="block text-xs font-black uppercase tracking-[0.12em] text-muted">Email<input className="input-glass mt-2" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="mt-5 block text-xs font-black uppercase tracking-[0.12em] text-muted">Password<input className="input-glass mt-2" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}<button className="btn-primary mt-7 w-full" disabled={submitting}><LockKeyhole size={15} />{submitting ? 'Checking access…' : 'Enter workspace'}<ArrowRight size={15} /></button></form>
  </main>
}
