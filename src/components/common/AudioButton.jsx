import { motion } from 'framer-motion'

export default function AudioButton({ onClick, isPlaying = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
      transition={isPlaying ? { repeat: Infinity, duration: 0.6 } : {}}
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center cursor-pointer`}
    >
      {isPlaying ? '🔊' : '🔈'}
    </motion.button>
  )
}
