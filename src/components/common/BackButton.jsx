// =====================================================
// ← BackButton.jsx - 뒤로 가기 버튼이에요!
// 화면을 이전 페이지로 돌아가게 해줘요
// 크림톤 배경 + 부드러운 그림자의 폭신한 원형 버튼
// =====================================================

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function BackButton({ to }) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--border-warm)',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.8), 0 3px 8px rgba(80,80,80,0.08)',
      }}
    >
      <img src="/images/ui/back.png" alt="뒤로가기" className="w-7 h-7 object-contain" />
    </motion.button>
  )
}
