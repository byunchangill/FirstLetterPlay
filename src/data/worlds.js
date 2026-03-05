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
    items: consonants,
    audioPath: '/audio/consonants/',
    imagePath: '/images/matching/consonants/',
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
    getLabel: (item) => String(item.number),
    getDisplayName: (item) => `${item.number} (${item.korean} / ${item.english})`,
    getHint: (item) => `${item.number}은 한글로 ${item.korean}, 영어로 ${item.english}!`,
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
    getLabel: (item) => `${item.upper}${item.lower}`,
    getDisplayName: (item) => `${item.upper} ${item.lower} - ${item.word}`,
    getHint: (item) => `${item.upper} is for ${item.word}!`,
  },
]

export function getWorldById(id) {
  return worlds.find(w => w.id === id)
}
