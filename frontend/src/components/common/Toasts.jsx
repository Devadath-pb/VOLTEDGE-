import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

const icons = { success: CheckCircle2, error: XCircle, info: Info }
const colors = {
  success: 'text-primary', error: 'text-red-500', info: 'text-sky-500',
}

export default function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type] ?? Info
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              className="glass-strong pointer-events-auto flex items-start gap-3 p-4"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colors[t.type] ?? colors.info}`} />
              <p className="flex-1 text-sm text-ink">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
