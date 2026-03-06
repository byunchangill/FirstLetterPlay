import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { characters } from '../data/characters'
import { useCharacter } from '../context/CharacterContext'
import BigButton from '../components/common/BigButton'
import SpeechBubble from '../components/common/SpeechBubble'

export default function SelectPage() {
  const navigate = useNavigate()
  const { selectCharacter } = useCharacter()
  const [selected, setSelected] = useState(null)

  const selectedChar = characters.find(c => c.id === selected)

  async function handleStart() {
    if (!selected) return
    await selectCharacter(selected)
    navigate('/world')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center px-4 py-8 bg-gradient-to-b from-purple-100 to-blue-50"
    >
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-jua text-[2.5rem] md:text-5xl text-purple-800 mb-8"
      >
        친구를 골라줘!
      </motion.h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-lg">
        {characters.map((char, i) => (
          <motion.button
            key={char.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(char.id)}
            className={`flex flex-col items-center p-4 rounded-2xl shadow-lg cursor-pointer transition-all ${selected === char.id
              ? 'ring-4 scale-105'
              : 'bg-white'
              }`}
            style={{
              backgroundColor: selected === char.id ? char.bgColor : 'white',
              ringColor: selected === char.id ? char.color : 'transparent',
              borderColor: selected === char.id ? char.color : 'transparent',
              border: selected === char.id ? `3px solid ${char.color}` : '3px solid transparent',
            }}
          >
            <img src={char.levels[0].image} alt={char.name} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3 drop-shadow-md" />
            <span className="font-jua text-2xl text-gray-800">{char.name}</span>
            <span className="font-gaegu text-xl text-gray-600">{char.description}</span>
          </motion.button>
        ))}
      </div>

      {selectedChar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <SpeechBubble
            text={selectedChar.greetings.hello}
            character={selectedChar}
          />

          <div className="flex justify-center">
            <BigButton onClick={handleStart} color={selectedChar.color}>
              이 친구와 시작! 🎉
            </BigButton>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
