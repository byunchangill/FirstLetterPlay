import { motion } from 'framer-motion'

export default function BigButton({ children, onClick, color = '#4CAF50', size = 'lg', className = '', disabled = false }) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-lg min-h-[48px]',
    md: 'px-6 py-3 text-xl min-h-[56px]',
    lg: 'px-8 py-4 text-2xl min-h-[64px]',
  }

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={disabled ? undefined : onClick}
      className={`rounded-2xl font-bold text-white shadow-lg ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{ backgroundColor: disabled ? '#999' : color }}
    >
      {children}
    </motion.button>
  )
}
