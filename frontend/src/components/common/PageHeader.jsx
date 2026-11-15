import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, right }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="page-header"
    >
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-3">{right}</div>}
    </motion.header>
  )
}
