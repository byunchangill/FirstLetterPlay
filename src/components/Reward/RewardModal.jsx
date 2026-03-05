import { motion } from 'framer-motion'
import StarDisplay from '../common/StarDisplay'
import BigButton from '../common/BigButton'
import ProgressBar from '../common/ProgressBar'

export default function RewardModal({ rewardData, character, onNext, onMap, hasNextStage }) {
  const { stars, exp, leveledUp, newLevel } = rewardData

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="text-center space-y-6 w-full max-w-sm"
    >
      {/* Celebration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="font-jua text-5xl text-yellow-600"
      >
        🎉 잘했어! 🎉
      </motion.div>

      {/* Stars */}
      <StarDisplay count={stars} animated size="lg" />

      {/* Character + EXP */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-6 shadow-lg space-y-3"
      >
        <div className="text-5xl">{character.emoji}</div>

        {leveledUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 1.2 }}
            className="font-jua text-3xl text-yellow-600"
          >
            ⬆️ Level {newLevel}!
          </motion.div>
        )}

        <p className="font-jua text-xl text-gray-700">+{exp} EXP</p>

        <ProgressBar
          current={(newLevel - 1) * 100 + (rewardData.newLevel === newLevel ? exp : 0)}
          total={100}
          color={character.color}
          height="h-4"
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="space-y-3"
      >
        {hasNextStage && (
          <BigButton onClick={onNext} color="#4CAF50">
            다음 스테이지 ▶
          </BigButton>
        )}
        <BigButton onClick={onMap} color="#2196F3" size="md">
          월드맵으로
        </BigButton>
      </motion.div>
    </motion.div>
  )
}
