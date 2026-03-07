// =====================================================
// 🎮 EasyMode.jsx - 쉬운 난이도 문제예요!
// 4개 선택지 중에서 맞는 글자를 고르는 문제예요
// 소리를 듣고 맞는 글자를 찾으면 돼요
// =====================================================

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAudio } from '../../hooks/useAudio'
import SpeechBubble from '../common/SpeechBubble'
import AudioButton from '../common/AudioButton'

// 배열을 섞어주는 함수예요 (Fisher-Yates 알고리즘)
function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function EasyMode({ item, world, character, questionIndex, onAnswer }) {
  // play: 소리를 재생하는 함수, isPlaying: 지금 소리가 나오는 중인지
  const { play, isPlaying } = useAudio()
  // selected: 선택한 답, answered: 이미 답했는지 여부
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  // 정답 글자를 가져와요 (예: 'ㄱ' 또는 'a')
  const correctLabel = world.getLabel(item)

  // 선택지 4개를 만들어요 (정답 1개 + 다른 글자 3개)
  const choices = useMemo(() => {
    // 정답이 아닌 다른 글자들 중 3개를 랜덤으로 선택
    const others = world.items
      .filter((_, i) => i !== world.items.indexOf(item))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(o => world.getLabel(o))

    // 정답과 다른 글자들을 섞어서 반환
    return shuffleArray([correctLabel, ...others])
  }, [item, world, correctLabel])

  // 처음에 글자 소리를 재생해요
  useEffect(() => {
    play(`${world.audioPath}${item.audio}`)
  }, [item])

  // 선택지를 눌렀을 때 실행되는 함수
  function handleSelect(choice) {
    if (answered) return  // 이미 답했으면 또 답할 수 없어요
    setSelected(choice)
    setAnswered(true)

    const isCorrect = choice === correctLabel  // 정답인지 확인
    setTimeout(() => {
      onAnswer(isCorrect)  // 부모에게 정답/오답 전달
    }, 200)  // 200ms 후 화면 전환
  }

  // 힌트 텍스트 (예: '기역')
  const hint = world.getHint(item)

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-3 md:space-y-6"
    >
      {/* 그림 + 글자 이름 표시 */}
      <div className="text-center">
        {item.image
          ? <img src={`${world.imagePath}${item.image}`} alt={item.word || item.name || ''} className="w-20 h-20 md:w-32 md:h-32 object-contain mx-auto mb-1 md:mb-2" />
          : <div className="text-5xl md:text-6xl mb-1 md:mb-2">📝</div>
        }
      </div>

      {/* 캐릭터가 힌트를 알려줘요 (예: "기역") */}
      <SpeechBubble text={hint} character={character} />

      {/* 소리 다시 듣는 버튼 */}
      <div className="flex justify-center">
        <AudioButton
          onClick={() => play(`${world.audioPath}${item.audio}`)}
          isPlaying={isPlaying}
          size="sm"
        />
      </div>

      {/* 4개의 선택지 */}
      <div>
        <p className="font-gaegu text-center text-lg md:text-2xl font-bold text-gray-700 mb-2 leading-tight">
          맞는 글자를 눌러봐!
        </p>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {choices.map((choice) => {
            let bg = 'bg-white'
            let border = 'border-gray-200'
            if (answered && choice === correctLabel) {
              bg = 'bg-green-100'
              border = 'border-green-500'
            } else if (answered && choice === selected && choice !== correctLabel) {
              bg = 'bg-red-100'
              border = 'border-red-400'
            }

            return (
              <motion.button
                key={choice}
                whileTap={!answered ? { scale: 0.9 } : {}}
                animate={
                  answered && choice === selected && choice !== correctLabel
                    ? { x: [0, -5, 5, -5, 0] }
                    : answered && choice === correctLabel
                      ? { scale: [1, 1.15, 1] }
                      : {}
                }
                onClick={() => handleSelect(choice)}
                className={`${bg} border-3 ${border} rounded-2xl p-3 md:p-4 font-jua text-3xl md:text-4xl text-gray-800 shadow-md cursor-pointer min-h-[60px] md:min-h-[80px] flex items-center justify-center`}
                style={{ borderWidth: '3px' }}
              >
                {choice}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
