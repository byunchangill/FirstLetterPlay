import { motion } from 'framer-motion'

export default function StarDisplay({ count = 0, max = 3, animated = false, size = 'md' }) {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8 md:w-10 md:h-10', lg: 'w-12 h-12 md:w-16 md:h-16' }

  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: max }, (_, i) => (
        <motion.img
          key={i}
          src={i < count ? '/images/ui/star-filled.png' : '/images/ui/star-empty.png'}
          alt={i < count ? 'star' : 'empty star'}
          initial={animated ? { scale: 0, rotate: -180 } : {}}
          animate={animated ? { scale: 1, rotate: 0 } : {}}
          transition={animated ? { delay: i * 0.3, type: 'spring', stiffness: 200 } : {}}
          className={`${sizeClasses[size]} object-contain`}
        />
      ))}
    </div>
  )
}
