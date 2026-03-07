// =====================================================
// 📌 Home.jsx - 앱을 켰을 때 제일 처음 나오는 시작 화면이에요!
// 로고와 "시작하기!" 버튼이 있어요.
// 이미 캐릭터를 만들었으면 월드맵으로 바로 이동해요.
// =====================================================

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BigButton from '../components/common/BigButton'
import { useCharacter } from '../context/CharacterContext'
import { characters } from '../data/characters'

export default function HomePage() {
  // navigate: 다른 페이지로 이동하는 함수예요
  const navigate = useNavigate()
  // hasProfile: 이미 캐릭터를 만들었는지, loading: 아직 불러오는 중인지
  const { hasProfile, loading } = useCharacter()

  // 앱이 켜질 때 캐릭터가 이미 있으면 바로 월드맵으로 이동해요
  useEffect(() => {
    if (!loading && hasProfile) {
      navigate('/world', { replace: true })
    }
  }, [loading, hasProfile, navigate])

  // 아직 데이터를 불러오는 중이거나 캐릭터가 있으면 로딩 스피너(⭐)를 보여줘요
  if (loading || hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        {/* 별이 빙글빙글 돌아가는 로딩 화면 */}
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

  // 캐릭터가 없으면 시작 화면을 보여줘요
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-blue-100 to-blue-50"
    >
      {/* 로고 이미지 (위에서 내려오는 애니메이션) */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-center mb-12"
      >
        <img src="/images/ui/logo.png" alt="FirstLetterPlay" className="w-[80vw] max-w-[400px] mx-auto mb-6 object-contain drop-shadow-xl" />
      </motion.div>

      {/* "시작하기!" 버튼 (아래에서 올라오는 애니메이션) */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <BigButton
          onClick={() => navigate(hasProfile ? '/world' : '/select')}
          color="#4CAF50"
          style={{
            background: 'linear-gradient(180deg, #5cc75c 0%, #41a847 100%)',
            boxShadow: '0 6px 14px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.3)',
          }}
        >
          <img src="/images/ui/start.png" alt="start" className="w-6 h-6 object-contain mr-2" /> 시작하기!
        </BigButton>
      </motion.div>

      {/* 캐릭터들이 위아래로 통통 튀는 장식 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex gap-4 text-4xl"
      >
        {/* 캐릭터마다 살짝 다른 타이밍으로 통통 튀어요 */}
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
