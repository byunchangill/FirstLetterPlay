import { useState, useCallback, useEffect } from 'react'
import { db } from '../db/dexie'
import { useCharacter } from '../context/CharacterContext'

export function useProgress() {
  const { profile } = useCharacter()
  const characterId = profile?.characterId
  const [progressMap, setProgressMap] = useState({})

  const loadProgress = useCallback(async (area) => {
    if (!characterId) return []
    const records = await db.progress
      .where('characterId')
      .equals(characterId)
      .filter(r => r.area === area)
      .toArray()

    const map = {}
    for (const r of records) {
      const key = `${characterId}-${r.area}-${r.stageIndex}-${r.difficulty}`
      map[key] = r
    }
    setProgressMap(prev => ({ ...prev, ...map }))
    return records
  }, [characterId])

  const getProgress = useCallback((area, stageIndex, difficulty) => {
    if (!characterId) return null
    const key = `${characterId}-${area}-${stageIndex}-${difficulty}`
    return progressMap[key] || null
  }, [progressMap, characterId])

  const saveProgress = useCallback(async (area, stageIndex, difficulty, stars) => {
    if (!characterId) return

    const existing = await db.progress
      .where('[characterId+area+stageIndex+difficulty]')
      .equals([characterId, area, stageIndex, difficulty])
      .first()

    if (existing) {
      if (stars > existing.stars) {
        await db.progress.update(existing.id, {
          stars,
          completed: true,
          completedAt: new Date(),
        })
      }
    } else {
      await db.progress.add({
        characterId,
        area,
        stageIndex,
        difficulty,
        stars,
        completed: true,
        completedAt: new Date(),
      })
    }

    await loadProgress(area)
  }, [loadProgress, characterId])

  const isStageUnlocked = useCallback((area, stageIndex, difficulty) => {
    if (stageIndex === 0 && difficulty === 'easy') return true

    if (difficulty === 'normal') {
      const p = getProgress(area, stageIndex, 'easy')
      return p?.completed || false
    }

    if (difficulty === 'hard') {
      const p = getProgress(area, stageIndex, 'normal')
      return p?.completed || false
    }

    if (difficulty === 'easy' && stageIndex > 0) {
      const p = getProgress(area, stageIndex - 1, 'hard')
      return p?.completed || false
    }

    return false
  }, [getProgress])

  const getStageStars = useCallback((area, stageIndex) => {
    const easy = getProgress(area, stageIndex, 'easy')
    const normal = getProgress(area, stageIndex, 'normal')
    const hard = getProgress(area, stageIndex, 'hard')
    const easyCount = easy?.stars > 0 ? 1 : 0
    const normalCount = normal?.stars > 0 ? 1 : 0
    const hardCount = hard?.stars > 0 ? 1 : 0
    return {
      easy: easy?.stars || 0,
      normal: normal?.stars || 0,
      hard: hard?.stars || 0,
      total: easyCount + normalCount + hardCount,
      allCleared: !!(easy?.completed && normal?.completed && hard?.completed),
    }
  }, [getProgress])

  const getAreaStats = useCallback((area, totalStages) => {
    let totalStars = 0
    let clearedStages = 0
    for (let i = 0; i < totalStages; i++) {
      const s = getStageStars(area, i)
      totalStars += s.total
      if (s.allCleared) clearedStages++
    }
    return {
      totalStars,
      maxStars: totalStages * 3,
      clearedStages,
      totalStages,
    }
  }, [getStageStars])

  return {
    loadProgress,
    getProgress,
    saveProgress,
    isStageUnlocked,
    getStageStars,
    getAreaStats,
  }
}
