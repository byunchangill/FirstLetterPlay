// =====================================================
// 🎮 NormalMode.jsx - 중간 난이도 문제예요!
// 글자와 그림을 맞춰서 고르는 문제예요
// 예: "ㄱ" 글자의 친구는 어디? → 기차 그림을 선택!
// =====================================================

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
// import { useSpeech } from '../../hooks/useSpeech'
// import { useAudio } from '../../hooks/useAudio'
import SpeechBubble from '../common/SpeechBubble'
// import BigButton from '../common/BigButton'

// 배열을 섞어주는 함수예요 (Fisher-Yates 알고리즘)
function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function NormalMode({ item, world, character, questionIndex, onAnswer }) {
  // 참고: 말하기 기능은 아직 만드는 중이에요 (추후 활성화 예정)
  // const { listen, result, isListening, supported } = useSpeech()
  // const { play } = useAudio()

  // matchSelected: 선택한 항목, answered: 이미 답했는지 여부
  const [matchSelected, setMatchSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  // 글자 레이블을 가져와요 (예: 'ㄱ')
  const label = world.getLabel(item)

  // 선택지를 만들어요 (정답 1개 + 다른 항목 2개)
  const matchChoices = useMemo(() => {
    // 정답이 아닌 다른 항목들 중 2개를 랜덤으로 선택
    const others = world.items
      .filter((_, i) => i !== world.items.indexOf(item))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    // 정답과 다른 항목들을 섞어서 반환
    return shuffleArray([item, ...others])
  }, [item, world])

  // 선택지를 눌렀을 때 실행되는 함수
  function handleMatchSelect(selected) {
    if (answered) return  // 이미 답했으면 또 답할 수 없어요
    setMatchSelected(selected)
    setAnswered(true)

    // 선택한 항목의 글자가 정답 글자와 같은지 확인
    const isCorrect = world.getLabel(selected) === label
    setTimeout(() => {
      onAnswer(isCorrect)  // 부모에게 정답/오답 전달
    }, 200)  // 200ms 후 화면 전환
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-3 md:space-y-6"
    >
      {/* 글자와 그림을 매칭하는 섹션 */}
      <div className="space-y-3 md:space-y-6">
        {/* 캐릭터 지시 메시지 */}
        <SpeechBubble text="맞는 짝을 찾아봐!" character={character} />

        {/* 큰 글자로 표시 + "이 글자의 친구는?" 질문 */}
        <div className="text-center">
          <span className="font-jua text-[3rem] md:text-[5rem] text-gray-800 leading-none">{label}</span>
          <p className="font-gaegu text-base md:text-xl font-bold text-gray-500 mt-1">이 글자의 친구는?</p>
        </div>

        {/* 선택지들 (3개 항목: 정답 + 오답 2개) */}
        <div className="space-y-2 md:space-y-3">
          {matchChoices.map((choice) => {
            const choiceLabel = world.getLabel(choice)
            const isCorrect = choiceLabel === label
            const isSelected = matchSelected && world.getLabel(matchSelected) === choiceLabel

            // 배경색 결정: 정답은 초록색, 틀린 답은 빨간색
            let bgColor = 'bg-white'
            if (answered && isCorrect) bgColor = 'bg-green-100'
            else if (answered && isSelected && !isCorrect) bgColor = 'bg-red-100'

            // 표시할 글자/이름 (예: "기차", "ㄱ" 등)
            const wordDisplay = choice.word || (world.id === 'numbers_en' ? choice.english : choice.korean) || choice.name || ''

            return (
              <motion.button
                key={choiceLabel}
                whileTap={!answered ? { scale: 0.95 } : {}}
                // 틀린 답이면 좌우로 흔드는 애니메이션
                animate={answered && isSelected && !isCorrect ? { x: [0, -5, 5, -5, 0] } : {}}
                onClick={() => handleMatchSelect(choice)}
                className={`w-full ${bgColor} rounded-2xl p-3 md:p-4 shadow-md flex items-center gap-3 md:gap-4 cursor-pointer`}
                // 정답이면 초록 테두리
                style={{ borderWidth: '3px', borderColor: answered && isCorrect ? '#4CAF50' : 'transparent' }}
              >
                {/* 그림 또는 아이콘 */}
                {choice.image
                  ? <img src={`${world.imagePath}${choice.image}`} alt={wordDisplay} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                  : <span className="text-2xl md:text-3xl">📝</span>
                }
                {/* 글자/이름 텍스트 */}
                <span className="font-jua text-xl md:text-2xl text-gray-800">{wordDisplay}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* TODO: 말하기 기능 추후 활성화
      <SpeechSection
        label={label}
        item={item}
        world={world}
        character={character}
      />
      */}
    </motion.div>
  )
}
