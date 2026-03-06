import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BigButton from '../components/common/BigButton'
import { useCharacter } from '../context/CharacterContext'
import { characters } from '../data/characters'

export default function HomePage() {
  const navigate = useNavigate()
  const { hasProfile, loading } = useCharacter()

  useEffect(() => {
    if (!loading && hasProfile) {
      navigate('/world', { replace: true })
    }
  }, [loading, hasProfile, navigate])

  if (loading || hasProfile) {
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
        <img src="/images/ui/logo.png" alt="FirstLetterPlay" className="w-[80vw] max-w-[400px] mx-auto mb-6 object-contain drop-shadow-xl" />
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
        {characters.map((char, i) => (
          <motion.img
            key={char.id}
            src={char.levels[0].image}
            alt={char.name}
            className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-md"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
