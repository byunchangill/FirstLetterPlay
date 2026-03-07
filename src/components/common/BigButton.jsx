// =====================================================
// 🎨 BigButton.jsx - 중요한 버튼이에요!
// 게임의 주요 선택지들(시작, 도전, 다음 등)을 누르는 버튼이에요
// 크기 3가지(sm/md/lg)와 색상을 선택할 수 있어요
// =====================================================

import { motion } from 'framer-motion'

export default function BigButton({ children, onClick, color = '#4CAF50', size = 'lg', className = '', disabled = false }) {
  // 버튼 크기 옵션들 (sm: 작음, md: 중간, lg: 큼)
  const sizeClasses = {
    sm: 'px-4 py-2 text-lg min-h-[48px]',
    md: 'px-6 py-3 text-xl min-h-[56px]',
    lg: 'px-8 py-4 text-2xl min-h-[64px]',
  }

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}  // 마우스 올리면 105% 확대 (비활성화되면 안 함)
      whileTap={disabled ? {} : { scale: 0.95 }}     // 누르면 95%로 축소 (비활성화되면 안 함)
      onClick={disabled ? undefined : onClick}       // 비활성화되면 클릭 안 됨
      className={`font-jua rounded-2xl font-bold text-white shadow-lg ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      // 비활성화되면 회색, 아니면 지정한 색상
      style={{ backgroundColor: disabled ? '#999' : color }}
    >
      {children}
    </motion.button>
  )
}
