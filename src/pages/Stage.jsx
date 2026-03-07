// =====================================================
// 📌 Stage.jsx - 실제로 문제를 풀며 글자를 배우는 화면이에요!
// 순서: 인트로(소개) → 쉬움 → 보통 → 어려움 → 결과(별 받기)
// 문제를 틀리면 '실패' 화면이 나오고 다시 도전할 수 있어요.
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getWorldById } from '../data/worlds'
import { getCharacterById } from '../data/characters'
import { useCharacter } from '../context/CharacterContext'
import { preloadWithPriority } from '../utils/audioCache'
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

// 난이도 순서: 쉬움 → 보통 → 어려움
const DIFFICULTIES = ['easy', 'normal', 'hard']
// 난이도별 문제 개수
const QUESTIONS_PER_DIFFICULTY = { easy: 1, normal: 1, hard: 2 }

// 맞힌 개수로 별 개수를 계산해요 (3개: 완벽, 2개: 잘함, 1개: 통과, 0개: 실패)
function calculateStars(correct, total) {
  const rate = total > 0 ? correct / total : 0
  if (rate >= 1.0) return 3
  if (rate >= 0.8) return 2
  if (rate >= 0.6) return 1
  return 0
}

export default function StagePage() {
  const navigate = useNavigate()
  // area: 어떤 월드인지 (예: consonants), index: 몇 번째 글자인지 (예: 0 = ㄱ)
  const { area, index } = useParams()
  const stageIndex = parseInt(index, 10)
  const world = getWorldById(area)  // 월드 정보 가져오기
  const { profile, growth, addExp } = useCharacter()
  const { saveProgress, isStageUnlocked, loadProgress, getStageStars } = useProgress()

  // 내 캐릭터 정보
  const character = profile ? getCharacterById(profile.characterId) : null

  // phase: 현재 어느 단계인지 (intro/easy/normal/hard/reward/failed)
  const [phase, setPhase] = useState('intro')
  // currentQ: 현재 몇 번째 문제인지 (0부터 시작)
  const [currentQ, setCurrentQ] = useState(0)
  // correctCount: 이번 난이도에서 맞힌 개수
  const [correctCount, setCorrectCount] = useState(0)
  // totalAnswered: 이번 난이도에서 답한 총 개수
  const [totalAnswered, setTotalAnswered] = useState(0)
  // stars: 받은 별 개수
  const [stars, setStars] = useState(0)
  // rewardData: 보상 화면에 보여줄 정보 (별, 경험치 등)
  const [rewardData, setRewardData] = useState(null)
  // difficultyIndex: 현재 난이도 번호 (0=쉬움, 1=보통, 2=어려움)
  const [difficultyIndex, setDifficultyIndex] = useState(0)
  // wasAlreadyMaxedRef: 이미 만점을 받은 스테이지이면 경험치를 안 줘요
  const wasAlreadyMaxedRef = useRef(false)

  // 화면이 열릴 때 저장된 진도를 불러와요
  useEffect(() => {
    if (!profile || !world) {
      navigate('/world')
      return
    }
    loadProgress(area)
  }, [profile, world, area, navigate, loadProgress])

  // 이미지와 오디오를 미리 불러와요 (Preload) → 클릭 즉시 출력되도록!
  useEffect(() => {
    if (!world || !world.items || !character) return

    const charId = character.id
    const currentItem = world.items[stageIndex]

    // 1) 이미지 프리로드
    world.items.forEach(wItem => {
      if (wItem.image) {
        const img = new Image()
        img.src = `${world.imagePath}${wItem.image}`
      }
    })

    // 2) 오디오 우선순위 프리로드
    // 현재 스테이지 아이템의 오디오를 가장 먼저 로딩!
    const priorityPaths = []
    if (currentItem) {
      if (world.getSpelAudioUrl) priorityPaths.push(world.getSpelAudioUrl(currentItem, charId))
      if (world.getWordAudioUrl) priorityPaths.push(world.getWordAudioUrl(currentItem, charId))
    }

    // 나머지 아이템의 오디오는 뒤이어 로딩
    const restPaths = []
    world.items.forEach((wItem, i) => {
      if (i === stageIndex) return  // 현재 아이템은 이미 위에서 처리
      if (world.getSpelAudioUrl) restPaths.push(world.getSpelAudioUrl(wItem, charId))
      if (world.getWordAudioUrl) restPaths.push(world.getWordAudioUrl(wItem, charId))
    })

    preloadWithPriority(priorityPaths, restPaths)
  }, [world, character, stageIndex])

  // 이 스테이지의 글자(항목) 정보를 가져와요
  const item = world?.items?.[stageIndex]
  if (!world || !item || !character) return null

  const currentDifficulty = DIFFICULTIES[difficultyIndex]       // 현재 난이도 이름
  const totalQsForDifficulty = QUESTIONS_PER_DIFFICULTY[currentDifficulty]  // 이 난이도 문제 수

  // 인트로 화면에서 "배우기 시작!" 버튼을 눌렀을 때 실행돼요
  function handleIntroComplete() {
    // 이미 만점인지 확인해요 (만점이면 나중에 경험치 안 줌)
    const stageStars = getStageStars(area, stageIndex)
    wasAlreadyMaxedRef.current = stageStars.allCleared
    setPhase('easy')  // 쉬움 난이도부터 시작
    setDifficultyIndex(0)
    setCurrentQ(0)
    setCorrectCount(0)
    setTotalAnswered(0)
  }

  // 문제를 맞히거나 틀렸을 때 실행돼요
  function handleAnswer(isCorrect) {
    if (isCorrect) setCorrectCount(prev => prev + 1)  // 맞히면 +1
    setTotalAnswered(prev => prev + 1)

    const nextQ = currentQ + 1
    if (nextQ >= totalQsForDifficulty) {
      // 이 난이도 문제를 모두 풀었어요!
      const earned = calculateStars(correctCount + (isCorrect ? 1 : 0), totalQsForDifficulty)

      if (earned === 0) {
        // 별을 하나도 못 얻으면 실패!
        setPhase('failed')
        return
      }

      // 이 난이도 결과를 저장해요
      saveProgress(area, stageIndex, currentDifficulty, earned)

      const nextDiff = difficultyIndex + 1
      if (nextDiff < DIFFICULTIES.length) {
        // 다음 난이도로 넘어가요 (쉬움 → 보통 → 어려움)
        setDifficultyIndex(nextDiff)
        setPhase(DIFFICULTIES[nextDiff])
        setCurrentQ(0)
        setCorrectCount(0)
        setTotalAnswered(0)
      } else {
        // 어려움까지 모두 클리어! 경험치 계산 후 보상 화면으로!
        const expGained = wasAlreadyMaxedRef.current ? 0 : earned * 5  // 이미 만점이면 경험치 없음
        setStars(earned)
        addExp(expGained).then(result => {
          setRewardData({
            stars: earned,
            exp: expGained,
            currentExp: result?.exp ?? 0,
            leveledUp: result?.leveledUp || false,
            newLevel: result?.level || growth?.level || 1,
          })
          setPhase('reward')  // 보상 화면으로!
        })
      }
    } else {
      // 다음 문제로 넘어가요
      setCurrentQ(nextQ)
    }
  }

  // "다시 도전!" 버튼을 눌렀을 때 현재 난이도를 처음부터 다시 시작해요
  function handleRetry() {
    setCurrentQ(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setPhase(currentDifficulty)
  }

  // 보상 화면에서 "다음 스테이지" 버튼을 눌렀을 때
  function handleNextStage() {
    const nextIndex = stageIndex + 1
    if (nextIndex < world.items.length) {
      // 다음 글자 스테이지로 이동해요
      navigate(`/stage/${area}/${nextIndex}`)
      setPhase('intro')
      setDifficultyIndex(0)
      setCurrentQ(0)
      setCorrectCount(0)
      setTotalAnswered(0)
      setRewardData(null)
    } else {
      // 이 월드의 마지막 스테이지였으면 월드맵으로 돌아가요
      navigate(`/world/${area}`)
    }
  }

  return (
    // 전체 화면 (화면 높이에 딱 맞게, 스크롤 없음)
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${world.bgColor}, #f8fafc)` }}
    >
      {/* 상단 헤더: 뒤로 가기 버튼 + 현재 난이도/문제 번호 */}
      <div className="relative flex items-center px-4 py-2 flex-shrink-0">
        <BackButton to={`/world/${area}`} />
        {/* 인트로/보상/실패 화면이 아닐 때만 난이도 표시 */}
        {phase !== 'intro' && phase !== 'reward' && phase !== 'failed' && (
          <div className="ml-auto text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
            {currentDifficulty === 'easy' ? '쉬움' : currentDifficulty === 'normal' ? '보통' : '어려움'}
            {' · '}{currentQ + 1}/{totalQsForDifficulty}
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 영역 (화면 단계에 따라 다른 화면을 보여줘요) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 pb-4">
        <AnimatePresence mode="wait">
          {/* 인트로 화면: 글자 소개 + 소리 듣기 + 배우기 시작 버튼 */}
          {phase === 'intro' && (
            <IntroView
              key="intro"
              item={item}
              world={world}
              character={character}
              onStart={handleIntroComplete}
            />
          )}
          {/* 쉬움 난이도 문제 */}
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
          {/* 보통 난이도 문제 */}
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
          {/* 어려움 난이도 문제 */}
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
          {/* 실패 화면: "다시 도전!" 또는 "월드맵으로" 버튼 */}
          {phase === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 md:space-y-6"
            >
              {/* 캐릭터가 응원 메시지를 해줘요 */}
              <SpeechBubble text={character.greetings.tryAgain} character={character} />
              <div className="flex gap-4 justify-center">
                <BigButton onClick={handleRetry} color="#FF9800" size="md">
                  다시 도전! <img src="/images/ui/replay.png" alt="replay" className="w-6 h-6 inline-block ml-1" />
                </BigButton>
                <BigButton onClick={() => navigate(`/world`)} color="#b8b0a8" size="md">
                  월드맵으로
                </BigButton>
              </div>
            </motion.div>
          )}
          {/* 보상 화면: 별 개수 + 경험치 + 다음 스테이지 버튼 */}
          {phase === 'reward' && rewardData && (
            <RewardModal
              key="reward"
              rewardData={rewardData}
              character={character}
              onNext={handleNextStage}
              onMap={() => navigate(`/world`)}
              hasNextStage={stageIndex + 1 < world.items.length}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// =====================================================
// IntroView - 스테이지를 시작할 때 글자를 소개해주는 화면이에요!
// 큰 글자 + 그림 + 소리 듣기 버튼 + "배우기 시작!" 버튼이 있어요.
// =====================================================
function IntroView({ item, world, character, onStart }) {
  // play: 소리를 재생하는 함수, isPlaying: 지금 소리가 나오는 중인지
  const { play, isPlaying } = useAudio()
  const hint = world.getHint(item)    // 힌트 텍스트 (예: '기역')
  const label = world.getLabel(item)  // 글자 표시 (예: 'ㄱ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="w-full max-w-lg md:max-w-xl mx-auto flex flex-col items-center gap-6 md:gap-10"
    >
      {/* 커다란 글자 (살살 흔들리며 관심을 끌어요) */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="font-jua text-[6rem] md:text-[10rem] text-gray-800 leading-none drop-shadow-xl"
      >
        {label}
      </motion.div>

      {/* 연관 그림 (예: ㄱ → 기린 그림) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="flex justify-center"
      >
        {item.image
          ? <img src={`${world.imagePath}${item.image}`} alt={item.word || item.name || ''} className="w-36 h-36 md:w-56 md:h-56 object-contain drop-shadow-lg" />
          : <span className="text-6xl md:text-8xl drop-shadow-md">📝</span>
        }
      </motion.div>

      {/* 캐릭터 말풍선 + 소리 버튼 + 시작 버튼 카드 */}
      <div
        className="flex flex-col items-center gap-4 md:gap-6 w-full p-5 md:p-10 rounded-[32px] backdrop-blur-sm"
        style={{
          background: 'var(--surface-2)',
          border: '2px solid var(--border-warm)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.8), 0 6px 14px rgba(82,82,82,0.06), 0 14px 28px rgba(82,82,82,0.05)',
        }}
      >
        <SpeechBubble text={`${label}${character.greetings.learn}`} character={character} />

        <AudioButton
          onClick={() => play(world.getSpelAudioUrl(item, character.id))}
          isPlaying={isPlaying}
          size="xl"
        />

        <BigButton onClick={onStart} color={world.color} size="md">
          배우기 시작! <img src="/images/ui/play.png" alt="play" className="w-6 h-6 inline-block ml-1" />
        </BigButton>
      </div>
    </motion.div>
  )
}
