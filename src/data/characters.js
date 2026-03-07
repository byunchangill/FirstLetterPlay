// =====================================================
// 📖 characters.js - 게임에 나오는 캐릭터들의 정보예요!
// 각 캐릭터는 이름, 색상, 레벨별 이미지, 인사말을 가져요
// 예: 다이노, 로봇, 유니콘, 클로버 등
// 레벨이 올라갈수록 캐릭터 모습이 변해요!
// =====================================================

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
      { level: 3, image: '/images/characters/dino-2.png', name: '알에서 깨어난 다이노' },
      { level: 5, image: '/images/characters/dino-3.png', name: '어린 다이노' },
      { level: 8, image: '/images/characters/dino-4.png', name: '멋진 다이노' },
    ],
    greetings: {
    name: '다이노',
      hello: '안녕! 나는 다이노야! 같이 해볼까?',
      great: '대단해! 정말 잘했어!',
      tryAgain: '괜찮아~ 다시 해보자!',
      learn: '을 배워볼까?',
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
      { level: 3, image: '/images/characters/tobot-2.png', name: '로봇 C' },
      { level: 5, image: '/images/characters/tobot-3.png', name: '로봇 X' },
      { level: 8, image: '/images/characters/tobot-4.png', name: '로봇 타이탄' },
    ],
    greetings: {
      hello: '삐빅! 나는 로봇! 같이 시작할까?',
      great: '미션 성공! 대단해!',
      tryAgain: '다시 도전! 할 수 있어!',
      learn: '을 배워볼까?',
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
      { level: 3, image: '/images/characters/elsa-2.png', name: '마법을 배우는 공주' },
      { level: 5, image: '/images/characters/elsa-3.png', name: '얼음 성의 공주' },
      { level: 8, image: '/images/characters/elsa-4.png', name: '여왕 공주' },
    ],
    greetings: {
      hello: '안녕~ 나는 공주야! 함께 해볼까?',
      great: '정말 멋져! 잘했어!',
      tryAgain: '괜찮아~ 한번 더 해보자!',
      learn: '을 배워볼까?',
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
      { level: 3, image: '/images/characters/hatchping-2.png', name: '날 수 있는 요정' },
      { level: 5, image: '/images/characters/hatchping-3.png', name: '마법 요정' },
      { level: 8, image: '/images/characters/hatchping-4.png', name: '슈퍼 요정' },
    ],
    greetings: {
      hello: '안녕! 나는 요정이야! 같이 시작해볼까?',
      great: '대단해! 최고야!',
      tryAgain: '다시 해볼까?',
      learn: '을 배워볼까?',
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
