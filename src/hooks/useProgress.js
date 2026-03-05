import { useState, useCallback, useEffect } from 'react'
import { db } from '../db/dexie'

export function useProgress() {
  const [progressMap, setProgressMap] = useState({})

  const loadProgress = useCallback(async (area) => {
    const records = await db.progress.where('area').equals(area).toArray()
    const map = {}
    for (const r of records) {
      const key = `${r.area}-${r.stageIndex}-${r.difficulty}`
      map[key] = r
    }
    setProgressMap(prev => ({ ...prev, ...map }))
    return records
  }, [])

  const getProgress = useCallback((area, stageIndex, difficulty) => {
    const key = `${area}-${stageIndex}-${difficulty}`
    return progressMap[key] || null
  }, [progressMap])

  const saveProgress = useCallback(async (area, stageIndex, difficulty, stars) => {
    const existing = await db.progress
      .where('[area+stageIndex+difficulty]')
      .equals([area, stageIndex, difficulty])
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
        area,
        stageIndex,
        difficulty,
        stars,
        completed: true,
        completedAt: new Date(),
      })
    }

    await loadProgress(area)
  }, [loadProgress])

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
    return {
      easy: easy?.stars || 0,
      normal: normal?.stars || 0,
      hard: hard?.stars || 0,
      total: (easy?.stars || 0) + (normal?.stars || 0) + (hard?.stars || 0),
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
      maxStars: totalStages * 9,
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
