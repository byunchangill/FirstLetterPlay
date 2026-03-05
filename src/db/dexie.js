import Dexie from 'dexie'

export const db = new Dexie('FirstLetterPlayDB')

db.version(1).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, area, stageIndex, difficulty, [area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId',
})

db.version(2).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, characterId, area, stageIndex, difficulty, [characterId+area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId',
})

db.version(3).stores({
  profiles: '++id, characterId, createdAt',
  progress: '++id, characterId, area, stageIndex, difficulty, [characterId+area+stageIndex+difficulty]',
  characterGrowth: '++id, characterId',
  settings: 'key',
})
