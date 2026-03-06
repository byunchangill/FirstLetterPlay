import { motion } from 'framer-motion'
import StarDisplay from '../common/StarDisplay'
import BigButton from '../common/BigButton'
import ProgressBar from '../common/ProgressBar'
import { getCharacterLevel } from '../../data/characters'

export default function RewardModal({ rewardData, character, onNext, onMap, hasNextStage }) {
  const { stars, exp, leveledUp, newLevel } = rewardData

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="text-center space-y-3 md:space-y-6 w-full max-w-sm"
    >
      {/* Celebration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="font-jua text-3xl md:text-5xl text-yellow-600 flex flex-col items-center gap-2"
      >
        <img src="/images/ui/trophy.png" alt="trophy" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-lg" />
        잘했어!
      </motion.div>

      {/* Stars */}
      <StarDisplay count={stars} animated size="lg" />

      {/* Character + EXP */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl p-4 md:p-6 shadow-lg space-y-2 md:space-y-3"
      >
        <img src={getCharacterLevel(character, newLevel).image} alt={character.name} className="w-20 h-20 md:w-32 md:h-32 object-contain mx-auto drop-shadow-md" />

        {leveledUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 1.2 }}
            className="font-jua text-2xl md:text-3xl text-yellow-600"
          >
            ⬆️ Level {newLevel}!
          </motion.div>
        )}

        <p className="font-jua text-lg md:text-xl text-gray-700">+{exp} EXP</p>

        <ProgressBar
          current={rewardData.currentExp}
          total={100}
          color={character.color}
          height="h-3 md:h-4"
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex justify-center items-stretch gap-3 w-full"
      >
        {hasNextStage && (
          <div className="flex-1 flex">
            <BigButton onClick={onNext} color="#4CAF50" size="md" className="w-full flex-1 flex flex-col items-center justify-center break-keep leading-tight px-1 py-4">
              <span>다음 스테이지</span>
              <span className="text-xl mt-1">▶</span>
            </BigButton>
          </div>
        )}
        <div className="flex-1 flex">
          <BigButton onClick={onMap} color="#2196F3" size="md" className="w-full flex-1 flex flex-col items-center justify-center break-keep leading-tight px-1 py-4">
            월드맵으로
          </BigButton>
        </div>
      </motion.div>
    </motion.div>
  )
}
