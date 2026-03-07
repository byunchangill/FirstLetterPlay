// =====================================================
// 💾 dexie.js - 게임 데이터를 저장하는 데이터베이스예요!
// IndexedDB를 사용해서 브라우저에 데이터를 저장해요
// 게임을 종료했다가 다시 켜도 진도가 남아있어요!
// =====================================================

import Dexie from 'dexie'

// FirstLetterPlayDB라는 이름의 데이터베이스를 만들어요
export const db = new Dexie('FirstLetterPlayDB')

// 버전 1: 처음 만들었을 때
db.version(1).stores({
  profiles: '++id, characterId, createdAt',  // 내 정보
  progress: '++id, area, stageIndex, difficulty, [area+stageIndex+difficulty]',  // 진도
  characterGrowth: '++id, characterId',  // 캐릭터 성장 정보
})

// 버전 2: 캐릭터별로 진도를 저장하도록 업데이트
db.version(2).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, characterId, area, stageIndex, difficulty, [characterId+area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId',
})

// 버전 3: 설정 저장 기능 추가
db.version(3).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, characterId, area, stageIndex, difficulty, [characterId+area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId',
  settings: 'key',  // 음량, 밝기 등 게임 설정을 저장해요
})
