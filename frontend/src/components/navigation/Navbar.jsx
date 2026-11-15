import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Bell, CircleUserRound, Menu, X, Zap, ChevronDown } from 'lucide-react'
import ConnectionIndicator from '../common/ConnectionIndicator.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export const navItems = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Live board' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/reuse', label: 'Reuse' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
]

function BrandMark() {
  return (
    <Link to="/" className="brand-lockup" aria-label="Voltedge home">
      <span className="brand-mark"><Zap size={19} fill="currentColor" /></span>
      <span>
        <span className="brand-name block">VOLTEDGE</span>
        <span className="brand-subtitle">Battery intelligence</span>
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

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary">
        <BrandMark />

        <div className="mx-1 hidden h-7 w-px bg-white/10 lg:block" />

        <ul className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                {({ isActive }) => (
                  <motion.span whileHover={{ y: -1 }} className="whitespace-nowrap">
                    {item.label}
                    {isActive && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />}
                  </motion.span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block"><ConnectionIndicator source={source} /></div>

          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
              aria-label="Notifications" aria-expanded={notifOpen}
              className="relative rounded-[9px] p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lime" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="glass-strong absolute right-0 mt-3 w-72 p-3">
                  <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted">Signal log</p>
                  <button onClick={() => { pushToast('Latest SOH prediction is available in Analytics.', 'info'); setNotifOpen(false) }} className="block w-full rounded-[9px] px-3 py-2 text-left text-sm text-ink hover:bg-lightmint">SOH prediction updated · review Analytics</button>
                  <button onClick={() => { pushToast('No unresolved alerts on the monitored battery.', 'success'); setNotifOpen(false) }} className="block w-full rounded-[9px] px-3 py-2 text-left text-sm text-ink hover:bg-lightmint">Temperature nominal · no alerts</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative hidden sm:block">
            <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }} aria-label="User menu" aria-expanded={profileOpen} className="flex items-center gap-1 rounded-[9px] p-1.5 text-white/65 transition hover:bg-white/10 hover:text-white">
              <CircleUserRound className="h-[19px] w-[19px]" /> <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="glass-strong absolute right-0 mt-3 w-60 p-2">
                  <div className="border-b border-ink/10 px-3 py-2"><p className="truncate text-sm font-bold text-ink">{user?.email ?? 'Demo operator'}</p><p className="text-xs text-muted">{configured ? 'Authenticated workspace' : 'Demo workspace'}</p></div>
                  <Link to="/settings" onClick={() => setProfileOpen(false)} className="mt-1 block rounded-[9px] px-3 py-2 text-sm text-ink hover:bg-lightmint">Settings</Link>
                  <button onClick={async () => { await signOut(); pushToast('Signed out.', 'info'); setProfileOpen(false) }} className="block w-full rounded-[9px] px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation menu" aria-expanded={mobileOpen} className="rounded-[9px] p-2 text-white lg:hidden hover:bg-white/10">
            {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </nav>
      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} source={source} />
    </header>
  )
}
