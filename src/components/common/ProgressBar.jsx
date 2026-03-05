import { motion } from 'framer-motion'

export default function ProgressBar({ current, total, color = '#4CAF50', height = 'h-3' }) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`${height} rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
