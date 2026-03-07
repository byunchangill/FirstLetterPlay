// =====================================================
// 📊 useProgress.js - 학습 진도를 저장하고 불러오는 훅이에요!
// 어느 스테이지를 몇 개 별로 클리어했는지 기억해요
// 예: "자음 나라 1번 쉬움 난이도: 3별" 같은 정보를 저장해요
// =====================================================

import { useState, useCallback, useEffect } from 'react'
import { db } from '../db/dexie'
import { useCharacter } from '../context/CharacterContext'

export function useProgress() {
  const { profile } = useCharacter()
  const characterId = profile?.characterId  // 내 캐릭터 아이디
  const [progressMap, setProgressMap] = useState({})  // 진도 정보를 메모리에 저장

  // loadProgress: 데이터베이스에서 진도 정보를 불러와요
  const loadProgress = useCallback(async (area) => {
    if (!characterId) return []
    // 내 캐릭터의 진도 정보를 찾아요 (area별로)
    const records = await db.progress
      .where('characterId')
      .equals(characterId)
      .filter(r => r.area === area)
      .toArray()

    // 빠른 조회를 위해 맵에 저장해요
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
