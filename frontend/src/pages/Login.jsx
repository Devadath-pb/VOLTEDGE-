import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Zap } from 'lucide-react'
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
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="glass-strong w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-bright to-primary text-white shadow-lg shadow-primary/25"><Zap className="h-6 w-6" fill="currentColor" /></span>
          <div><p className="font-poppins text-xl font-extrabold text-ink">Voltedge</p><p className="text-sm text-muted">Battery intelligence platform</p></div>
        </div>
        <h1 className="font-poppins text-2xl font-bold text-ink">Sign in to your workspace</h1>
        <p className="mt-2 text-sm text-muted">Access only the batteries assigned to your account.</p>
        <label className="mt-6 block text-sm font-semibold text-ink">Email<input className="input-glass mt-2" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="mt-4 block text-sm font-semibold text-ink">Password<input className="input-glass mt-2" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={submitting}><LogIn className="h-4 w-4" />{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}
