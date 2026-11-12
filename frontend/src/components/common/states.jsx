import { AlertTriangle, Inbox, RefreshCw, FlaskConical } from 'lucide-react'

export function LoadingState({ label = 'Loading data…' }) {
  return (
    <div className="glass flex flex-col items-center gap-4 p-10" role="status" aria-live="polite">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-mint border-t-primary" />
      </div>
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass p-6" aria-hidden="true">
      <div className="skeleton mb-4 h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton mb-3 h-3" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="glass flex flex-col items-center gap-4 p-10 text-center" role="alert">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <div>
        <p className="font-semibold text-ink">Something went wrong</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary !px-5 !py-2 text-xs">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'No data available', hint }) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-10 text-center">
      <Inbox className="h-10 w-10 text-primary/60" />
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}

export function DemoBadge({ className = '' }) {
  return (
    <span className={`chip bg-amber-100 text-amber-700 ${className}`} title="Values are simulated demo data, not live measurements">
      <FlaskConical className="h-3.5 w-3.5" /> DEMO
    </span>
  )
}
