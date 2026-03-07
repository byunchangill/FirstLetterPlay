import { motion } from 'framer-motion'

export default function AudioButton({ onClick, isPlaying = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-[88px] h-[88px] md:w-[112px] md:h-[112px]',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      animate={isPlaying ? { scale: [1, 1.15, 1] } : {}}
      transition={isPlaying ? { repeat: Infinity, duration: 0.6 } : {}}
      onClick={onClick}
      className={`${sizeClasses[size]} flex items-center justify-center cursor-pointer`}
      style={{ border: 'none', background: 'transparent' }}
    >
      <img src="/images/ui/speaker.png" alt="음성 듣기" className="w-full h-full object-contain" />
    </motion.button>
  )
}
