// =====================================================
// 🏆 RewardModal.jsx - 스테이지 클리어 보상 화면이에요!
// 받은 별 개수, 경험치, 레벨업 등을 보여줘요
// 다음 스테이지로 가거나 월드맵으로 돌아갈 수 있어요
// =====================================================

import { motion } from 'framer-motion'
import StarDisplay from '../common/StarDisplay'
import BigButton from '../common/BigButton'
import ProgressBar from '../common/ProgressBar'
import { getCharacterLevel } from '../../data/characters'

export default function RewardModal({ rewardData, character, onNext, onMap, hasNextStage }) {
  // 받은 별, 경험치, 레벨업 여부, 새로운 레벨 정보
  const { stars, exp, leveledUp, newLevel } = rewardData

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="text-center space-y-3 md:space-y-6 w-full max-w-sm"
    >
      {/* 축하 메시지 (트로피 + "잘했어!") */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="font-jua text-3xl md:text-5xl text-yellow-600 flex flex-col items-center gap-2"
      >
        <img src="/images/ui/trophy.png" alt="trophy" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-lg" />
        잘했어!
      </motion.div>

      {/* 받은 별들 (회전하며 나타나요) */}
      <StarDisplay count={stars} animated size="lg" />

      {/* 캐릭터 + 경험치 정보 */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-4 md:p-6 shadow-lg space-y-2 md:space-y-3"
      >
        {/* 현재 레벨에 맞는 캐릭터 모습 */}
        <img src={getCharacterLevel(character, newLevel).image} alt={character.name} className="w-20 h-20 md:w-32 md:h-32 object-contain mx-auto drop-shadow-md" />

        {/* 레벨업했으면 축하 메시지 표시 */}
        {leveledUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 font-jua text-2xl md:text-3xl text-yellow-600"
          >
            <img src="/images/ui/up.png" alt="up" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm" /> Level {newLevel}!
          </motion.div>
        )}

        {/* 획득한 경험치와 현재 진행도 */}
        <div className="flex justify-between items-end px-1 -mb-1">
          <p className="font-jua text-lg md:text-xl text-gray-700">+{exp} EXP</p>
          <p className="font-jua text-base md:text-lg" style={{ color: character.color }}>
            {Math.round(rewardData.currentExp)}%
          </p>
        </div>

        {/* 경험치 진행도 막대 (다음 레벨까지) */}
        <ProgressBar
          current={rewardData.currentExp}
          total={100}
          color={character.color}
          height="h-3 md:h-4"
        />
      </motion.div>

      {/* 다음 단계로 이동하는 버튼들 */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex justify-center items-stretch gap-3 w-full"
      >
        {/* 다음 스테이지가 있으면 "다음 스테이지" 버튼을 보여줘요 */}
        {hasNextStage && (
          <div className="flex-1 flex">
            <BigButton onClick={onNext} color="#4CAF50" size="md" className="w-full flex-1 flex flex-col items-center justify-center break-keep leading-tight px-1 py-4">
              <span>다음 스테이지</span>
              <span className="text-xl mt-1">▶</span>
            </BigButton>
          </div>
        )}
        {/* "월드맵으로" 버튼: 항상 보여요 */}
        <div className="flex-1 flex">
          <BigButton onClick={onMap} color="#2196F3" size="md" className="w-full flex-1 flex flex-col items-center justify-center break-keep leading-tight px-1 py-4">
            월드맵으로
          </BigButton>
        </div>
      </motion.div>
    </motion.div>
  )
}
