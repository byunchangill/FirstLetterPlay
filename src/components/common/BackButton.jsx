// =====================================================
// ← BackButton.jsx - 뒤로 가기 버튼이에요!
// 화면을 이전 페이지로 돌아가게 해줘요
// to 속성이 있으면 그 주소로 가고, 없으면 그냥 한 번 뒤로 가요
// =====================================================

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function BackButton({ to }) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}  // 누르면 90%로 작아져요
      // to가 있으면 그 주소로 가고, 없으면 브라우저 뒤로 가기
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl cursor-pointer"
    >
      ← {/* 왼쪽 화살표 */}
    </motion.button>
  )
}
