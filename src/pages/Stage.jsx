import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getWorldById } from '../data/worlds'
import { getCharacterById } from '../data/characters'
import { useCharacter } from '../context/CharacterContext'
import { useProgress } from '../hooks/useProgress'
import { useAudio } from '../hooks/useAudio'
import BackButton from '../components/common/BackButton'
import SpeechBubble from '../components/common/SpeechBubble'
import BigButton from '../components/common/BigButton'
import StarDisplay from '../components/common/StarDisplay'
import AudioButton from '../components/common/AudioButton'
import EasyMode from '../components/Stage/EasyMode'
import NormalMode from '../components/Stage/NormalMode'
import HardMode from '../components/Stage/HardMode'
import RewardModal from '../components/Reward/RewardModal'

const DIFFICULTIES = ['easy', 'normal', 'hard']
const QUESTIONS_PER_DIFFICULTY = { easy: 1, normal: 1, hard: 2 }

function calculateStars(correct, total) {
  const rate = total > 0 ? correct / total : 0
  if (rate >= 1.0) return 3
  if (rate >= 0.8) return 2
  if (rate >= 0.6) return 1
  return 0
}

export default function StagePage() {
  const navigate = useNavigate()
  const { area, index } = useParams()
  const stageIndex = parseInt(index, 10)
  const world = getWorldById(area)
  const { profile, growth, addExp } = useCharacter()
  const { saveProgress, isStageUnlocked, loadProgress } = useProgress()

  const character = profile ? getCharacterById(profile.characterId) : null

  const [phase, setPhase] = useState('intro') // intro, easy, normal, hard, reward, failed
  const [currentQ, setCurrentQ] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [stars, setStars] = useState(0)
  const [rewardData, setRewardData] = useState(null)
  const [difficultyIndex, setDifficultyIndex] = useState(0)

  useEffect(() => {
    if (!profile || !world) {
      navigate('/world')
      return
    }
    loadProgress(area)
  }, [profile, world, area, navigate, loadProgress])

  const item = world?.items?.[stageIndex]
  if (!world || !item || !character) return null

  const currentDifficulty = DIFFICULTIES[difficultyIndex]
  const totalQsForDifficulty = QUESTIONS_PER_DIFFICULTY[currentDifficulty]

  function handleIntroComplete() {
    setPhase('easy')
    setDifficultyIndex(0)
    setCurrentQ(0)
    setCorrectCount(0)
    setTotalAnswered(0)
  }

  function handleAnswer(isCorrect) {
    if (isCorrect) setCorrectCount(prev => prev + 1)
    setTotalAnswered(prev => prev + 1)

    const nextQ = currentQ + 1
    if (nextQ >= totalQsForDifficulty) {
      // Difficulty complete
      const earned = calculateStars(correctCount + (isCorrect ? 1 : 0), totalQsForDifficulty)

      if (earned === 0) {
        setPhase('failed')
        return
      }

      // Save progress for this difficulty
      saveProgress(area, stageIndex, currentDifficulty, earned)

      const nextDiff = difficultyIndex + 1
      if (nextDiff < DIFFICULTIES.length) {
        // Move to next difficulty
        setDifficultyIndex(nextDiff)
        setPhase(DIFFICULTIES[nextDiff])
        setCurrentQ(0)
        setCorrectCount(0)
        setTotalAnswered(0)
      } else {
        // All difficulties complete
        const expGained = earned * 5
        setStars(earned)
        addExp(expGained).then(result => {
          setRewardData({
            stars: earned,
            exp: expGained,
            leveledUp: result?.leveledUp || false,
            newLevel: result?.level || growth?.level || 1,
          })
          setPhase('reward')
        })
      }
    } else {
      setCurrentQ(nextQ)
    }
  }

  function handleRetry() {
    setCurrentQ(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setPhase(currentDifficulty)
  }

  function handleNextStage() {
    const nextIndex = stageIndex + 1
    if (nextIndex < world.items.length) {
      navigate(`/stage/${area}/${nextIndex}`)
      setPhase('intro')
      setDifficultyIndex(0)
      setCurrentQ(0)
      setCorrectCount(0)
      setTotalAnswered(0)
      setRewardData(null)
    } else {
      navigate(`/world/${area}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(to bottom, ${world.bgColor}, #f8fafc)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BackButton to={`/world/${area}`} />
          <span className="font-bold text-lg text-gray-700">
            {world.getLabel(item)} 배우기
          </span>
        </div>
        {phase !== 'intro' && phase !== 'reward' && phase !== 'failed' && (
          <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
            {currentDifficulty === 'easy' ? '쉬움' : currentDifficulty === 'normal' ? '보통' : '어려움'}
            {' · '}{currentQ + 1}/{totalQsForDifficulty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <IntroView
              key="intro"
              item={item}
              world={world}
              character={character}
              onStart={handleIntroComplete}
            />
          )}
          {phase === 'easy' && (
            <EasyMode
              key={`easy-${currentQ}`}
              item={item}
              world={world}
              character={character}
              questionIndex={currentQ}
              onAnswer={handleAnswer}
            />
          )}
          {phase === 'normal' && (
            <NormalMode
              key={`normal-${currentQ}`}
              item={item}
              world={world}
              character={character}
              questionIndex={currentQ}
              onAnswer={handleAnswer}
            />
          )}
          {phase === 'hard' && (
            <HardMode
              key={`hard-${currentQ}`}
              item={item}
              world={world}
              character={character}
              questionIndex={currentQ}
              onAnswer={handleAnswer}
            />
          )}
          {phase === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <SpeechBubble text={character.greetings.tryAgain} character={character} />
              <div className="space-y-3">
                <BigButton onClick={handleRetry} color="#FF9800">
                  다시 도전! 💪
                </BigButton>
                <BigButton onClick={() => navigate(`/world/${area}`)} color="#9E9E9E" size="md">
                  월드맵으로
                </BigButton>
              </div>
            </motion.div>
          )}
          {phase === 'reward' && rewardData && (
            <RewardModal
              key="reward"
              rewardData={rewardData}
              character={character}
              onNext={handleNextStage}
              onMap={() => navigate(`/world/${area}`)}
              hasNextStage={stageIndex + 1 < world.items.length}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function IntroView({ item, world, character, onStart }) {
  const { play, isPlaying } = useAudio()
  const hint = world.getHint(item)
  const label = world.getLabel(item)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="text-center space-y-6 w-full max-w-sm"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-8xl md:text-9xl font-black text-gray-800"
      >
        {label}
      </motion.div>

      <div className="text-6xl">
        {item.image ? '🖼️' : '📝'}
      </div>

      <SpeechBubble text={`${label}${character.greetings.learn}`} character={character} />

      <div className="flex justify-center">
        <AudioButton
          onClick={() => play(`${world.audioPath}${item.audio}`)}
          isPlaying={isPlaying}
          size="lg"
        />
      </div>

      <BigButton onClick={onStart} color={world.color}>
        배우기 시작! 🚀
      </BigButton>
    </motion.div>
  )
}
