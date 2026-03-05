import { motion } from 'framer-motion'

export default function StarDisplay({ count = 0, max = 3, animated = false, size = 'md' }) {
  const sizeClasses = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl' }

  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: max }, (_, i) => (
        <motion.span
          key={i}
          initial={animated ? { scale: 0, rotate: -180 } : {}}
          animate={animated ? { scale: 1, rotate: 0 } : {}}
          transition={animated ? { delay: i * 0.3, type: 'spring', stiffness: 200 } : {}}
          className={sizeClasses[size]}
        >
          {i < count ? '⭐' : '☆'}
        </motion.span>
      ))}
    </div>
  )
}
