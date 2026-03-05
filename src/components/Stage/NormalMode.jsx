import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
// import { useSpeech } from '../../hooks/useSpeech'
// import { useAudio } from '../../hooks/useAudio'
import SpeechBubble from '../common/SpeechBubble'
// import BigButton from '../common/BigButton'

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function NormalMode({ item, world, character, questionIndex, onAnswer }) {
  // TODO: 말하기 기능은 추후 활성화
  // const { listen, result, isListening, supported } = useSpeech()
  // const { play } = useAudio()

  const [matchSelected, setMatchSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const label = world.getLabel(item)

  const matchChoices = useMemo(() => {
    const others = world.items
      .filter((_, i) => i !== world.items.indexOf(item))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    return shuffleArray([item, ...others])
  }, [item, world])

  function handleMatchSelect(selected) {
    if (answered) return
    setMatchSelected(selected)
    setAnswered(true)

    const isCorrect = world.getLabel(selected) === label
    setTimeout(() => {
      onAnswer(isCorrect)
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-6"
    >
      {/* Matching Quiz Section */}
      <div className="space-y-6">
        <SpeechBubble text="맞는 짝을 찾아봐!" character={character} />

        <div className="text-center">
          <span className="font-jua text-[5rem] text-gray-800 leading-none">{label}</span>
          <p className="font-gaegu text-xl font-bold text-gray-500 mt-1">이 글자의 친구는?</p>
        </div>

        <div className="space-y-3">
          {matchChoices.map((choice) => {
            const choiceLabel = world.getLabel(choice)
            const isCorrect = choiceLabel === label
            const isSelected = matchSelected && world.getLabel(matchSelected) === choiceLabel

            let bgColor = 'bg-white'
            if (answered && isCorrect) bgColor = 'bg-green-100'
            else if (answered && isSelected && !isCorrect) bgColor = 'bg-red-100'

            const wordDisplay = choice.word || choice.korean || choice.name || ''

            return (
              <motion.button
                key={choiceLabel}
                whileTap={!answered ? { scale: 0.95 } : {}}
                animate={answered && isSelected && !isCorrect ? { x: [0, -5, 5, -5, 0] } : {}}
                onClick={() => handleMatchSelect(choice)}
                className={`w-full ${bgColor} rounded-2xl p-4 shadow-md flex items-center gap-4 cursor-pointer`}
                style={{ borderWidth: '3px', borderColor: answered && isCorrect ? '#4CAF50' : 'transparent' }}
              >
                {choice.image
                  ? <img src={`${world.imagePath}${choice.image}`} alt={wordDisplay} className="w-12 h-12 object-contain" />
                  : <span className="text-3xl">📝</span>
                }
                <span className="font-jua text-2xl text-gray-800">{wordDisplay}</span>
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
