export default function GlassCard({ className = '', hover = true, children, ...rest }) {
  return (
    <div
      className={`glass ${hover ? 'glass-hover' : ''} p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
