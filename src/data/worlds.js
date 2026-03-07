// =====================================================
// 📖 worlds.js - 게임의 월드(세계)들의 정보예요!
// 각 월드는 자음, 모음, 숫자, 알파벳 중 하나를 배우는 곳이에요
// 각 월드마다 다른 배경색, 아이콘, 학습 항목이 있어요
// =====================================================

import { consonants } from './consonants'
import { vowels } from './vowels'
import { numbers } from './numbers'
import { alphabet } from './alphabet'

export const worlds = [
  {
    id: 'consonants',
    name: '자음 나라',
    icon: '\uD83C\uDFD4\uFE0F',
    color: '#4CAF50',
    bgColor: '#C8E6C9',
    description: '한글 자음을 배워요!',
    items: consonants,  // 자음 리스트
    audioPath: '/audio/consonants/',  // 소리 파일 위치
    imagePath: '/images/matching/consonants/',  // 그림 파일 위치
    bgImage: '/images/worlds/consonant-bg.png',
    getLabel: (item) => item.letter,
    getDisplayName: (item) => `${item.letter} (${item.name})`,
    getHint: (item) => `${item.letter}은 ${item.word}의 ${item.letter}이야!`,
  },
  {
    id: 'vowels',
    name: '모음 나라',
    icon: '\uD83C\uDF0A',
    color: '#2196F3',
    bgColor: '#B3E5FC',
    description: '한글 모음을 배워요!',
    items: vowels,
    audioPath: '/audio/vowels/',
    imagePath: '/images/matching/vowels/',
    bgImage: '/images/worlds/vowel-bg.png',
    getLabel: (item) => item.letter,
    getDisplayName: (item) => `${item.letter} (${item.name})`,
    getHint: (item) => `${item.letter}는 ${item.word}의 ${item.letter}!`,
  },
  {
    id: 'numbers',
    name: '숫자 나라',
    icon: '\uD83C\uDF1F',
    color: '#FF9800',
    bgColor: '#FFF9C4',
    description: '숫자를 배워요!',
    items: numbers,
    audioPath: '/audio/numbers/',
    imagePath: '/images/matching/numbers/',
    bgImage: '/images/worlds/number-bg.png',
    hasTabs: true,
    tabs: [
      { id: 'kr', name: '한글', color: '#FF9800' },
      { id: 'en', name: '영어', color: '#4CAF50' }
    ]
  },
  {
    id: 'alphabet',
    name: '알파벳 나라',
    icon: '\uD83D\uDE80',
    color: '#FF5722',
    bgColor: '#FFE0B2',
    description: '영어 알파벳을 배워요!',
    items: alphabet,
    audioPath: '/audio/alphabet/',
    imagePath: '/images/matching/alphabet/',
    bgImage: '/images/worlds/alphabet-bg.png',
    hasTabs: true,
    tabs: [
      { id: 'upper', name: '대문자', color: '#FF5722' },
      { id: 'lower', name: '소문자', color: '#FF9800' }
    ]
  },
]

const pseudoWorldsCache = {}

export function getWorldById(id) {
  if (id && id.startsWith('alphabet_')) {
    if (pseudoWorldsCache[id]) return pseudoWorldsCache[id]

    const base = worlds.find(w => w.id === 'alphabet')
    const tab = id.split('_')[1]
    const pseudo = {
      ...base,
      id,
      parentId: base.id,
      name: tab === 'upper' ? '알파벳 대문자' : '알파벳 소문자',
      color: tab === 'upper' ? '#FF5722' : '#FF9800',
      getLabel: (item) => tab === 'lower' ? item.lower : item.upper,
      getDisplayName: (item) => `${tab === 'lower' ? item.lower : item.upper} - ${item.word}`,
      getHint: (item) => `${tab === 'lower' ? item.lower : item.upper} is for ${item.word}!`,
    }
    pseudoWorldsCache[id] = pseudo
    return pseudo
  }
  if (id && id.startsWith('numbers_')) {
    if (pseudoWorldsCache[id]) return pseudoWorldsCache[id]

    const base = worlds.find(w => w.id === 'numbers')
    const tab = id.split('_')[1]
    const pseudo = {
      ...base,
      id,
      parentId: base.id,
      name: tab === 'kr' ? '숫자 나라' : '숫자 나라',
      color: tab === 'kr' ? '#FF9800' : '#4CAF50',
      getLabel: (item) => tab === 'kr' ? String(item.number) : item.english,
      getDisplayName: (item) => `${item.number} - ${tab === 'kr' ? item.korean : item.english}`,
      getHint: (item) => `${item.number}은 ${tab === 'kr' ? "한글로 " + item.korean + " 또는 " + item.korean2 : "영어로 " + item.english}!`,
      items: base.items.map(item => ({
        ...item,
        audio: tab === 'kr' ? item.audioKr : item.audioEn
      }))
    }
    pseudoWorldsCache[id] = pseudo
    return pseudo
  }
  return worlds.find(w => w.id === id)
}
