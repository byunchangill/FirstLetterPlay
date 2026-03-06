import { motion } from 'framer-motion'

export default function AudioButton({ onClick, isPlaying = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      animate={isPlaying ? { scale: [1, 1.15, 1] } : {}}
      transition={isPlaying ? { repeat: Infinity, duration: 0.6 } : {}}
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center cursor-pointer`}
      style={{ border: 'none' }}
    >
      <img src="/images/ui/speaker.png" alt="음성 듣기" className="w-[60%] h-[60%] object-contain" />
    </motion.button>
  )
}
