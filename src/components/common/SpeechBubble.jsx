// =====================================================
// 💬 SpeechBubble.jsx - 캐릭터의 말풍선이에요!
// 캐릭터가 격려하거나 안내하는 메시지를 표시해줘요
// 예: "좋아! 이제 시작해볼까?" 이런 식으로요
// =====================================================

import { motion } from 'framer-motion'
import { useCharacter } from '../../context/CharacterContext'
import { getCharacterLevel } from '../../data/characters'

export default function SpeechBubble({ text, character }) {
  // 내 캐릭터 정보와 현재 레벨을 가져와요
  const { growth } = useCharacter()
  // 현재 레벨에 맞는 캐릭터 이미지를 가져와요 (레벨 올라가면 캐릭터도 변해요!)
  const charImage = character ? getCharacterLevel(character, growth?.level).image : '/images/characters/dino-1.png'

  return (
    <div className="flex items-end justify-center gap-2 px-2 md:px-4">
      {/* 캐릭터 그림 */}
      <img src={charImage} alt={character?.name || 'character'} className="w-12 h-12 md:w-16 md:h-16 object-contain flex-shrink-0 drop-shadow-md" />
      {/* 말풍선 (아래에서 떠올라 나타나요) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 md:px-4 md:py-3 shadow-md max-w-[200px] md:max-w-[280px]"
      >
        {/* 캐릭터의 메시지 텍스트 */}
        <p className="font-gaegu text-base md:text-[1.3rem] font-bold text-gray-800 leading-tight">{text}</p>
      </motion.div>
    </div>
  )
}
