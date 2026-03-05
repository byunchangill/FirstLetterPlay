import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BigButton from '../components/common/BigButton'
import { useCharacter } from '../context/CharacterContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { hasProfile, loading } = useCharacter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="text-6xl"
        >
          ⭐
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-blue-100 to-blue-50"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-center mb-12"
      >
        <div className="text-7xl mb-4">📚</div>
        <h1 className="text-4xl md:text-5xl font-black text-blue-800 mb-2">
          FirstLetterPlay
        </h1>
        <p className="text-xl md:text-2xl text-blue-600 font-medium">
          첫 글자 놀이
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <BigButton
          onClick={() => navigate(hasProfile ? '/world' : '/select')}
          color="#4CAF50"
        >
          🎮 시작하기!
        </BigButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex gap-4 text-4xl"
      >
        {['🦕', '🤖', '❄️', '💗'].map((emoji, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  )
}
