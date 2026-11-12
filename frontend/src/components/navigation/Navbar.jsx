import { NavLink, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Bell, UserCircle2, Menu, X, ChevronDown } from 'lucide-react'
import ConnectionIndicator from '../common/ConnectionIndicator.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export const navItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/reuse', label: 'Reuse' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
]

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Voltedge home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-bright to-primary shadow-md shadow-primary/30">
        <Zap className="h-5 w-5 text-white" fill="currentColor" />
      </span>
      <span className="font-poppins text-lg font-extrabold tracking-tight text-ink">
        Volt<span className="text-primary">edge</span>
      </span>
    </Link>
  )
}

export default function Navbar({ source }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { pushToast } = useApp()
  const { user, configured, signOut } = useAuth()

  useEffect(() => { setMobileOpen(false) }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:px-5" aria-label="Primary">
        <BrandMark />

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'}>
                {({ isActive }) => (
                  <motion.span
                    className={`relative inline-block rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive ? 'pill-active' : 'text-muted hover:text-darkgreen'
                    }`}
                    whileHover={{ y: -1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block"><ConnectionIndicator source={source} /></div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
              aria-label="Notifications" aria-expanded={notifOpen}
              className="relative rounded-full border border-white/80 bg-white/70 p-2 text-muted transition hover:text-primary"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-bright volt-live-dot" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
                  className="glass-strong absolute right-0 mt-2 w-72 p-3"
                >
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted">Notifications</p>
                  <div className="space-y-1 text-sm">
                    <button onClick={() => { pushToast('Latest SOH prediction is available in Analytics.', 'info'); setNotifOpen(false) }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-ink hover:bg-lightmint">
                      SOH prediction updated · 87.4%
                    </button>
                    <button onClick={() => { pushToast('No unresolved alerts on the monitored battery.', 'success'); setNotifOpen(false) }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-ink hover:bg-lightmint">
                      Temperature nominal — no alerts
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
              aria-label="User menu" aria-expanded={profileOpen}
              className="flex items-center gap-1 rounded-full border border-white/80 bg-white/70 p-1.5 text-muted transition hover:text-primary"
            >
              <UserCircle2 className="h-6 w-6" />
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
                  className="glass-strong absolute right-0 mt-2 w-56 p-2"
                >
                  <div className="border-b border-primary/10 px-3 py-2">
                    <p className="text-sm font-semibold text-ink">{user?.email ?? 'Demo operator'}</p>
                    <p className="text-xs text-muted">{configured ? 'Authenticated workspace' : 'Demo workspace'}</p>
                  </div>
                  <Link to="/settings" onClick={() => setProfileOpen(false)}
                    className="mt-1 block rounded-xl px-3 py-2 text-sm text-ink hover:bg-lightmint">Settings</Link>
                  <button onClick={async () => { await signOut(); pushToast('Signed out.', 'info'); setProfileOpen(false) }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu" aria-expanded={mobileOpen}
            className="rounded-full border border-white/80 bg-white/70 p-2 text-ink lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} source={source} />
    </header>
  )
}
