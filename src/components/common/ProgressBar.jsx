// =====================================================
// 📊 ProgressBar.jsx - 진행 상황을 보여주는 막대예요!
// 몇 개를 완료했는지 비율로 표시해줘요
// 예: "5개 중 3개 클리어" → 60% 채워진 막대가 보여요
// =====================================================

import { motion } from 'framer-motion'

export default function ProgressBar({ current, total, color = '#4CAF50', height = 'h-3' }) {
  // 현재 진행도를 퍼센트로 계산해요 (3/5 = 60%)
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={`w-full rounded-full ${height} overflow-hidden`} style={{ background: 'var(--progress-track, #DDD7CC)' }}>
      {/* 회색 배경 막대 위에 색칠된 진행 막대가 있어요 */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`${height} rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
