// =====================================================
// 🎨 BigButton.jsx - 중요한 버튼이에요!
// 게임의 주요 선택지들(시작, 도전, 다음 등)을 누르는 버튼이에요
// 크기 3가지(sm/md/lg)와 색상을 선택할 수 있어요
// 폭신한 장난감 느낌의 그라데이션 + inset 하이라이트 적용
// =====================================================

import { motion } from 'framer-motion'

// 색상 코드를 받아서 살짝 어두운 색을 만들어요 (그라데이션 아래쪽용)
function darken(hex, amount = 20) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount)
  const b = Math.max(0, (num & 0x0000FF) - amount)
  return `rgb(${r},${g},${b})`
}

// 색상 코드에서 rgba 값을 만들어요 (그림자 색상용)
function hexToRgba(hex, alpha) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16)
  const g = (num >> 8) & 0xFF
  const b = num & 0xFF
  return `rgba(${r},${g},${b},${alpha})`
}

export default function BigButton({ children, onClick, color = '#4CAF50', size = 'lg', className = '', disabled = false, style: styleProp = {} }) {
  // 버튼 크기 옵션들 (sm: 작음, md: 중간, lg: 큼)
  const sizeClasses = {
    sm: 'px-5 py-2.5 text-lg min-h-[48px]',
    md: 'px-7 py-3.5 text-xl min-h-[56px]',
    lg: 'px-9 py-4.5 text-2xl min-h-[64px]',
  }

  const actualColor = disabled ? '#aaa' : color

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={disabled ? undefined : onClick}
      className={`font-jua rounded-[22px] font-bold text-white flex items-center justify-center gap-1 ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        background: `linear-gradient(180deg, ${actualColor} 0%, ${darken(actualColor, 24)} 100%)`,
        boxShadow: disabled ? 'none' : `inset 0 2px 0 rgba(255,255,255,0.28), 0 5px 12px ${hexToRgba(actualColor, 0.3)}`,
        border: 'none',
        ...styleProp,
      }}
    >
      {children}
    </motion.button>
  )
}
