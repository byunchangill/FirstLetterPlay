import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAudio } from '../../hooks/useAudio'
import SpeechBubble from '../common/SpeechBubble'
import AudioButton from '../common/AudioButton'

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function EasyMode({ item, world, character, questionIndex, onAnswer }) {
  const { play, isPlaying } = useAudio()
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const correctLabel = world.getLabel(item)

  const choices = useMemo(() => {
    const others = world.items
      .filter((_, i) => i !== world.items.indexOf(item))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(o => world.getLabel(o))

    return shuffleArray([correctLabel, ...others])
  }, [item, world, correctLabel])

  useEffect(() => {
    play(`${world.audioPath}${item.audio}`)
  }, [item])

  function handleSelect(choice) {
    if (answered) return
    setSelected(choice)
    setAnswered(true)

    const isCorrect = choice === correctLabel
    setTimeout(() => {
      onAnswer(isCorrect)
    }, 1200)
  }

  const hint = world.getHint(item)

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-3 md:space-y-6"
    >
      {/* Image + Letter */}
      <div className="text-center">
        {item.image
          ? <img src={`${world.imagePath}${item.image}`} alt={item.word || item.name || ''} className="w-20 h-20 md:w-32 md:h-32 object-contain mx-auto mb-1 md:mb-2" />
          : <div className="text-5xl md:text-6xl mb-1 md:mb-2">📝</div>
        }
      </div>

      {/* Character hint */}
      <SpeechBubble text={hint} character={character} />

      {/* Audio replay */}
      <div className="flex justify-center">
        <AudioButton
          onClick={() => play(`${world.audioPath}${item.audio}`)}
          isPlaying={isPlaying}
          size="sm"
        />
      </div>

      {/* 4 choices */}
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
