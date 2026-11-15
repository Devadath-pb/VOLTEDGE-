import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { navItems } from './Navbar.jsx'
import ConnectionIndicator from '../common/ConnectionIndicator.jsx'

export default function MobileNavigation({ open, onClose, source }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="glass-strong mx-auto mt-2 max-w-[1440px] p-3 lg:hidden"
        >
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block rounded-[9px] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] transition ${
                      isActive ? 'pill-active' : 'text-muted hover:bg-lightmint'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-center border-t border-primary/10 pt-3">
            <ConnectionIndicator source={source} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
