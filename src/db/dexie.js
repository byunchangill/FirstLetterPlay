import Dexie from 'dexie'

export const db = new Dexie('FirstLetterPlayDB')

db.version(1).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, area, stageIndex, difficulty, [area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId',
})
