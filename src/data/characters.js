// =====================================================
// 📖 characters.js - 게임에 나오는 캐릭터들의 정보예요!
// 각 캐릭터는 이름, 색상, 레벨별 이미지, 인사말을 가져요
// 예: 다이노, 로봇, 유니콘, 클로버 등
// 레벨이 올라갈수록 캐릭터 모습이 변해요!
// =====================================================

// =====================================================
// 🎮 레벨업 시스템 설정
// 어린 아이들이 초반에 빠르게 레벨업하고, 점차 더 많은 스테이지가 필요해요
// 예: 레벨 1→2는 2~3스테이지, 레벨 7→8은 11~12스테이지
// =====================================================

// 각 레벨에서 다음 레벨로 올라가기 위해 필요한 경험치예요
// 스테이지당 최대 15 EXP (별 3개 × 5), 평균 ~10~12 EXP
export const LEVEL_EXP_TABLE = {
  1: 30,   // 레벨 1→2: ~2~3스테이지 (초반이라 쉽게!)
  2: 45,   // 레벨 2→3: ~3~4스테이지
  3: 60,   // 레벨 3→4: ~4~5스테이지
  4: 80,   // 레벨 4→5: ~5~6스테이지
  5: 100,  // 레벨 5→6: ~7~8스테이지
  6: 130,  // 레벨 6→7: ~9~10스테이지
  7: 160,  // 레벨 7→8: ~11~12스테이지 (최고 레벨!)
}

// 최대 레벨 - 이 레벨에 도달하면 더 이상 레벨업하지 않아요
export const MAX_LEVEL = 8

// 특정 레벨에서 다음 레벨까지 필요한 경험치를 알려줘요
// 예: getExpForLevel(1) → 30 (레벨 1에서 2로 가려면 30 EXP 필요)
export function getExpForLevel(level) {
  return LEVEL_EXP_TABLE[level] || 160
}

export const characters = [
  {
    id: 'dino',
    name: '다이노',
    emoji: '\uD83E\uDD95',
    // description: '귀여운 아기 공룡',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    levels: [
      { level: 1, image: '/images/characters/dino-1.png', name: '알 다이노' },
      { level: 2, image: '/images/characters/dino-2.png', name: '알에서 깨어난 다이노' },
      { level: 4, image: '/images/characters/dino-3.png', name: '어린 다이노' },
      { level: 6, image: '/images/characters/dino-4.png', name: '멋진 다이노' },
    ],
    greetings: {
    name: '다이노',
      hello: '안녕! 나는 다이노야! 같이 해볼까?',
      great: '대단해! 정말 잘했어!',
      tryAgain: '괜찮아~ 다시 해보자!',
      learn: '을 들어볼까?',
    },
  },
  {
    id: 'tobot',
    name: '로봇',
    emoji: '\uD83E\uDD16',
    // description: '로봇',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    levels: [
      { level: 1, image: '/images/characters/tobot-1.png', name: '미니 로봇' },
      { level: 2, image: '/images/characters/tobot-2.png', name: '로봇 C' },
      { level: 4, image: '/images/characters/tobot-3.png', name: '로봇 X' },
      { level: 6, image: '/images/characters/tobot-4.png', name: '로봇 타이탄' },
    ],
    greetings: {
      hello: '삐빅! 나는 로봇! 같이 시작할까?',
      great: '미션 성공! 대단해!',
      tryAgain: '다시 도전! 할 수 있어!',
      learn: '을 들어볼까?',
    },
  },
  {
    id: 'elsa',
    name: '공주',
    emoji: '\u2744\uFE0F',
    // description: '얼음 공주',
    color: '#90CAF9',
    bgColor: '#E8EAF6',
    levels: [
      { level: 1, image: '/images/characters/elsa-1.png', name: '어린 공주' },
      { level: 2, image: '/images/characters/elsa-2.png', name: '마법을 배우는 공주' },
      { level: 4, image: '/images/characters/elsa-3.png', name: '얼음 성의 공주' },
      { level: 6, image: '/images/characters/elsa-4.png', name: '여왕 공주' },
    ],
    greetings: {
      hello: '안녕~ 나는 공주야! 함께 해볼까?',
      great: '정말 멋져! 잘했어!',
      tryAgain: '괜찮아~ 한번 더 해보자!',
      learn: '을 들어볼까?',
    },
  },
  {
    id: 'hatchping',
    name: '요정',
    emoji: '\uD83D\uDC97',
    // description: '귀여운 요정',
    color: '#E91E63',
    bgColor: '#FCE4EC',
    levels: [
      { level: 1, image: '/images/characters/hatchping-1.png', name: '아기 요정' },
      { level: 2, image: '/images/characters/hatchping-2.png', name: '날 수 있는 요정' },
      { level: 4, image: '/images/characters/hatchping-3.png', name: '마법 요정' },
      { level: 6, image: '/images/characters/hatchping-4.png', name: '슈퍼 요정' },
    ],
    greetings: {
      hello: '안녕! 나는 요정이야! 같이 시작해볼까?',
      great: '대단해! 최고야!',
      tryAgain: '다시 해볼까?',
      learn: '을 들어볼까?',
    },
  },
]

export function getCharacterById(id) {
  return characters.find(c => c.id === id)
}

export function getCharacterLevel(character, level) {
  if (!character) return character?.levels?.[0]
  const sorted = [...character.levels].sort((a, b) => b.level - a.level)
  return sorted.find(l => level >= l.level) || character.levels[0]
}
