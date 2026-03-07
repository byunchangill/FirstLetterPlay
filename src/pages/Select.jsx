// =====================================================
// 📌 Select.jsx - 내 공부 친구를 고르는 화면이에요!
// 귀여운 캐릭터 중 하나를 터치하면 선택할 수 있어요.
// 캐릭터를 고르면 "안녕!" 하고 인사도 해줘요.
// =====================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { characters } from '../data/characters'
import { useCharacter } from '../context/CharacterContext'
import BigButton from '../components/common/BigButton'
import SpeechBubble from '../components/common/SpeechBubble'

export default function SelectPage() {
  // navigate: 다른 화면으로 이동하는 함수예요
  const navigate = useNavigate()
  // selectCharacter: 캐릭터를 저장하는 함수예요
  const { selectCharacter } = useCharacter()
  // selected: 지금 선택된 캐릭터의 아이디예요 (처음엔 아무도 안 골라졌어요)
  const [selected, setSelected] = useState(null)

  // selectedChar: 선택된 캐릭터의 정보를 찾아줘요
  const selectedChar = characters.find(c => c.id === selected)

  // 시작 버튼을 눌렀을 때 실행돼요
  async function handleStart() {
    if (!selected) return  // 아무도 안 골랐으면 아무것도 안 해요
    await selectCharacter(selected)  // 캐릭터를 저장해요
    navigate('/world')  // 월드맵 화면으로 이동해요
  }

  return (
    // 화면 전체를 보라색-파란색 그라데이션으로 꾸며요
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] flex flex-col items-center px-4 py-8 bg-gradient-to-b from-purple-100 to-blue-50"
    >
      {/* "친구를 골라줘!" 제목 (위에서 내려오는 애니메이션) */}
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-jua text-[2.5rem] md:text-5xl text-purple-800 mb-8"
      >
        친구를 골라줘!
      </motion.h1>

      {/* 메인 콘텐츠 - 태블릿/PC에서 수직 중앙 배치 */}
      <div className="flex-1 flex items-start md:items-center w-full">
        <div className="w-full flex flex-col items-center">
          {/* 캐릭터 카드들을 2열(모바일) 또는 4열(큰 화면)로 보여줘요 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4 w-full max-w-4xl">
            {characters.map((char, i) => {
              const isSelected = selected === char.id;
              return (
                // 캐릭터 카드 버튼 (통통 튀어 나타나요)
                <motion.button
                  key={char.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: isSelected ? 1.05 : 1,
                    opacity: 1
                  }}
                  transition={{ delay: i * 0.1, duration: 0.3, ease: 'easeOut' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(char.id)}
                  className={`flex flex-col items-center p-4 md:p-6 rounded-[24px] cursor-pointer transition-colors outline-none ${isSelected ? 'z-10' : ''}`}
                  style={{
                    backgroundColor: isSelected ? char.bgColor : 'var(--surface)',
                    border: `3px solid ${isSelected ? char.color : 'var(--border-warm)'}`,
                    boxShadow: isSelected
                      ? `inset 0 2px 0 rgba(255,255,255,0.7), 0 8px 20px rgba(0,0,0,0.12)`
                      : 'inset 0 2px 0 rgba(255,255,255,0.8), 0 3px 8px rgba(80,80,80,0.07)',
                  }}
                >
                  {/* 캐릭터 그림 (선택되면 통통 튕기는 애니메이션 효과 추가) */}
                  <motion.img
                    animate={isSelected ? { y: [0, -8, 0] } : { y: 0 }}
                    transition={{ repeat: isSelected ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
                    src={char.levels[0].image}
                    alt={char.name}
                    className="w-20 h-20 md:w-28 md:h-28 object-contain mb-3 drop-shadow-md"
                  />
                  {/* 캐릭터 이름 (예: 코코) */}
                  <span className="font-jua text-2xl md:text-3xl text-gray-800">{char.name}</span>
                  {/* 캐릭터 설명 (예: 귀여운 강아지) */}
                  <span className="font-gaegu text-xl md:text-2xl text-gray-600">{char.description}</span>
                </motion.button>
              );
            })}
          </div>

          {/* 캐릭터를 골랐을 때만 아래에 인사말과 시작 버튼이 나타나요 */}
          <div className="min-h-[220px] w-full max-w-sm flex justify-center mt-2 md:mt-6">
            {selectedChar && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full flex flex-col space-y-6 items-center"
              >
                {/* 캐릭터가 말풍선으로 "안녕!" 하고 인사해요 */}
                <SpeechBubble
                  text={selectedChar.greetings.hello}
                  character={selectedChar}
                />

                {/* 시작 버튼 */}
                <div className="flex justify-center w-full pb-8">
                  <BigButton onClick={handleStart} color={selectedChar.color}>
                    이 친구와 시작! 🎉
                  </BigButton>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
