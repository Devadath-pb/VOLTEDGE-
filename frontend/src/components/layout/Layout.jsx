import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../navigation/Navbar.jsx'
import Toasts from '../common/Toasts.jsx'
import { DemoBadge } from '../common/states.jsx'
import { useApp } from '../../context/AppContext.jsx'

// Shared live-source probe so the navbar indicator reflects the real connection state.
function useGlobalSource() {
  const { demoMode, connected } = useApp()
  if (demoMode) return 'demo'
  return connected ? 'live' : 'disconnected'
}

export default function Layout({ children }) {
  const { demoMode } = useApp()
  const location = useLocation()
  const source = useGlobalSource()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar source={source} />
      {demoMode && (
        <div className="fixed inset-x-0 top-[72px] z-40 flex justify-center px-4 sm:top-[80px]">
          <DemoBadge className="shadow-sm" />
        </div>
      )}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-28 sm:px-6 sm:pt-32"
      >
        {children}
      </motion.main>
      <footer className="border-t border-primary/10 py-6 text-center text-xs text-muted">
        Voltedge · Battery Health Monitoring & Reuse System · {new Date().getFullYear()}
      </footer>
      <Toasts />
    </div>
  )
}
