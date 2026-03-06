import { useState, useEffect, useCallback, useRef } from 'react'
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
  const { saveProgress, isStageUnlocked, loadProgress, getStageStars } = useProgress()

  const character = profile ? getCharacterById(profile.characterId) : null

  const [phase, setPhase] = useState('intro') // intro, easy, normal, hard, reward, failed
  const [currentQ, setCurrentQ] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [stars, setStars] = useState(0)
  const [rewardData, setRewardData] = useState(null)
  const [difficultyIndex, setDifficultyIndex] = useState(0)
  const wasAlreadyMaxedRef = useRef(false)

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
    const stageStars = getStageStars(area, stageIndex)
    wasAlreadyMaxedRef.current = stageStars.total >= 9
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
        const expGained = wasAlreadyMaxedRef.current ? 0 : earned * 5
        setStars(earned)
        addExp(expGained).then(result => {
          setRewardData({
            stars: earned,
            exp: expGained,
            currentExp: result?.exp ?? 0,
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
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${world.bgColor}, #f8fafc)` }}
    >
      {/* Header */}
      <div className="relative flex items-center px-4 py-2 flex-shrink-0">
        <BackButton to={`/world/${area}`} />
        <span className="absolute left-1/2 -translate-x-1/2 font-jua text-2xl text-gray-700">
          {world.getLabel(item)} 배우기
        </span>
        {phase !== 'intro' && phase !== 'reward' && phase !== 'failed' && (
          <div className="ml-auto text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
            {currentDifficulty === 'easy' ? '쉬움' : currentDifficulty === 'normal' ? '보통' : '어려움'}
            {' · '}{currentQ + 1}/{totalQsForDifficulty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 pb-4">
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
              className="text-center space-y-4 md:space-y-6"
            >
              <SpeechBubble text={character.greetings.tryAgain} character={character} />
              <div className="flex gap-4 justify-center">
                <BigButton onClick={handleRetry} color="#FF9800" size="md">
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
      className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12"
    >
      {/* Left (or Top on Mobile): Letter & Image */}
      <div className="flex flex-col items-center gap-3 md:gap-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="font-jua text-[5rem] md:text-[9rem] text-gray-800 leading-none drop-shadow-xl"
        >
          {label}
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="flex justify-center"
        >
          {item.image
            ? <img src={`${world.imagePath}${item.image}`} alt={item.word || item.name || ''} className="w-32 h-32 md:w-56 md:h-56 object-contain drop-shadow-lg" />
            : <span className="text-5xl md:text-8xl drop-shadow-md">📝</span>
          }
        </motion.div>
      </div>

      {/* Right (or Bottom on Mobile): Interactions */}
      <div className="flex flex-col items-center gap-4 md:gap-8 w-full max-w-md bg-white/40 p-5 md:p-10 rounded-[2rem] shadow-xl backdrop-blur-sm border border-white/50">
        <SpeechBubble text={`${label}${character.greetings.learn}`} character={character} />

        <div className="bg-white/50 p-3 md:p-6 rounded-full shadow-inner">
          <AudioButton
            onClick={() => play(`${world.audioPath}${item.audio}`)}
            isPlaying={isPlaying}
            size="md"
          />
        </div>

        <div className="w-full flex justify-center">
          <BigButton onClick={onStart} color={world.color} size="md">
            배우기 시작! 🚀
          </BigButton>
        </div>
      </div>
    </motion.div>
  )
}
