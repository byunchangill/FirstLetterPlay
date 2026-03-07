// =====================================================
// ⭐ StarDisplay.jsx - 별 개수를 보여주는 컴포넌트예요!
// 스테이지를 클리어했을 때 받은 별 개수(0~3개)를 표시해요
// 예: ⭐⭐⭐ 완벽하게 했어요! / ⭐⭐☆ 잘했어요!
// =====================================================

import { motion } from 'framer-motion'

export default function StarDisplay({ count = 0, max = 3, animated = false, size = 'md' }) {
  // 별 크기 옵션들 (sm: 작음, md: 중간, lg: 큼)
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8 md:w-10 md:h-10', lg: 'w-12 h-12 md:w-16 md:h-16' }

  return (
    <div className="flex gap-1 justify-center">
      {/* max 개의 별을 만들어요 (예: max=3이면 별 3개를 그려요) */}
      {Array.from({ length: max }, (_, i) => (
        <motion.img
          key={i}
          // count보다 적은 번호면 채워진 별 ⭐, 아니면 빈 별 ☆
          src={i < count ? '/images/ui/star-filled.png' : '/images/ui/star-empty.png'}
          alt={i < count ? 'star' : 'empty star'}
          // animated가 true이면 회전하면서 나타나는 애니메이션
          initial={animated ? { scale: 0, rotate: -180 } : {}}
          animate={animated ? { scale: 1, rotate: 0 } : {}}
          transition={animated ? { delay: i * 0.3, type: 'spring', stiffness: 200 } : {}}
          className={`${sizeClasses[size]} object-contain`}
        />
      ))}
    </div>
  )
}
