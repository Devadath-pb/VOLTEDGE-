import { useApp } from '../../context/AppContext.jsx'

export default function ConnectionIndicator({ source }) {
  const { connected, lastValidReading } = useApp()
  const isLive = source === 'live' || connected
  const label = source === 'demo' ? 'Demo data' : isLive ? 'Connected' : source === 'connecting' ? 'Connecting…' : 'Disconnected'
  return (
    <span
      className={`chip ${isLive ? 'bg-mint text-darkgreen' : source === 'demo' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}
      title={lastValidReading ? `Last valid reading: ${new Date(lastValidReading).toLocaleString()}` : undefined}
    >
      <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-bright volt-live-dot' : source === 'demo' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {label}
    </span>
  )
}
