export const characters = [
  {
    id: 'dino',
    name: '디노',
    emoji: '\uD83E\uDD95',
    description: '귀여운 아기 공룡',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    levels: [
      { level: 1, image: '/images/characters/dino-1.png', name: '알에서 태어난 디노' },
      { level: 3, image: '/images/characters/dino-2.png', name: '조금 자란 디노' },
      { level: 5, image: '/images/characters/dino-3.png', name: '날개가 생긴 디노' },
      { level: 8, image: '/images/characters/dino-4.png', name: '멋진 용이 된 디노' },
    ],
    greetings: {
      hello: '안녕! 나는 디노야! 같이 공부하자!',
      great: '대단해! 정말 잘했어!',
      tryAgain: '괜찮아~ 다시 해보자!',
      learn: '을 배워볼까?',
    },
  },
  {
    id: 'tobot',
    name: '또봇',
    emoji: '\uD83E\uDD16',
    description: '변신 로봇 또봇',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    levels: [
      { level: 1, image: '/images/characters/tobot-1.png', name: '미니 또봇' },
      { level: 3, image: '/images/characters/tobot-2.png', name: '또봇 C' },
      { level: 5, image: '/images/characters/tobot-3.png', name: '또봇 X' },
      { level: 8, image: '/images/characters/tobot-4.png', name: '또봇 타이탄' },
    ],
    greetings: {
      hello: '출동! 나는 또봇이야! 함께 배우자!',
      great: '미션 성공! 대단해!',
      tryAgain: '다시 도전! 할 수 있어!',
      learn: '을 배워볼까?',
    },
  },
  {
    id: 'elsa',
    name: '엘사',
    emoji: '\u2744\uFE0F',
    description: '얼음 공주 엘사',
    color: '#90CAF9',
    bgColor: '#E8EAF6',
    levels: [
      { level: 1, image: '/images/characters/elsa-1.png', name: '어린 엘사' },
      { level: 3, image: '/images/characters/elsa-2.png', name: '마법을 배우는 엘사' },
      { level: 5, image: '/images/characters/elsa-3.png', name: '얼음 성의 엘사' },
      { level: 8, image: '/images/characters/elsa-4.png', name: '여왕 엘사' },
    ],
    greetings: {
      hello: '안녕~ 나는 엘사야! 같이 놀자!',
      great: '정말 멋져! 잘했어!',
      tryAgain: '괜찮아~ 한번 더 해보자!',
      learn: '을 배워볼까?',
    },
  },
  {
    id: 'hatchping',
    name: '하츄핑',
    emoji: '\uD83D\uDC97',
    description: '귀여운 하츄핑',
    color: '#E91E63',
    bgColor: '#FCE4EC',
    levels: [
      { level: 1, image: '/images/characters/hatchping-1.png', name: '아기 하츄핑' },
      { level: 3, image: '/images/characters/hatchping-2.png', name: '날 수 있는 하츄핑' },
      { level: 5, image: '/images/characters/hatchping-3.png', name: '마법 하츄핑' },
      { level: 8, image: '/images/characters/hatchping-4.png', name: '슈퍼 하츄핑' },
    ],
    greetings: {
      hello: '하츄! 나는 하츄핑이야! 신나게 배우자!',
      great: '하츄~ 대단해! 최고야!',
      tryAgain: '하츄~ 다시 해볼까?',
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
