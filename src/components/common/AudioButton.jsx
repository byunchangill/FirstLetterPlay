// =====================================================
// 🔊 AudioButton.jsx - 소리 듣는 버튼이에요!
// 누르면 글자 발음을 들을 수 있어요.
// 재생 중이면 버튼이 살살 커졌다 작아져요 (펄스 효과)
// =====================================================

import { motion } from 'framer-motion'

export default function AudioButton({ onClick, isPlaying = false, size = 'md' }) {
  // 버튼 크기 옵션 (sm/md/lg/xl)
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-[88px] h-[88px] md:w-[112px] md:h-[112px]',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}  // 누르면 90%로 작아져요
      // 소리가 재생 중이면 1 → 1.15 → 1 반복 애니메이션 (펄스 효과)
      animate={isPlaying ? { scale: [1, 1.15, 1] } : {}}
      transition={isPlaying ? { repeat: Infinity, duration: 0.6 } : {}}
      onClick={onClick}
      className={`${sizeClasses[size]} flex items-center justify-center cursor-pointer`}
      style={{ border: 'none', background: 'transparent' }}
    >
      {/* 스피커 아이콘 이미지 */}
      <img src="/images/ui/speaker.png" alt="음성 듣기" className="w-full h-full object-contain" />
    </motion.button>
  )
}
