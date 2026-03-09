// =====================================================
// 📊 useProgress.js - 학습 진도를 저장하고 불러오는 훅이에요!
// 어느 스테이지를 몇 개 별로 클리어했는지 기억해요.
// 이전에는 브라우저에 저장했지만, 이제는 Supabase 클라우드에 저장해요!
// =====================================================

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useCharacter } from '../context/CharacterContext'
import { useAuth } from '../context/AuthContext'

export function useProgress() {
  const { profile } = useCharacter()
  const { user } = useAuth()
  // characterId: 내 캐릭터 아이디 (Supabase는 character_id 컬럼명 사용)
  const characterId = profile?.character_id
  // progressMap: 불러온 진도 정보를 메모리에 저장해서 빠르게 조회해요
  const [progressMap, setProgressMap] = useState({})

  // loadProgress: Supabase에서 특정 영역의 진도를 불러와요
  const loadProgress = useCallback(async (area) => {
    if (!characterId || !user) return []

    // 내 캐릭터의 해당 영역 진도를 모두 가져와요
    const { data: records, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('character_id', characterId)
      .eq('area', area)

    if (error) {
      console.error('진도 불러오기 실패:', error.message)
      return []
    }

    // 빠른 조회를 위해 키-값 형태의 맵으로 변환해요
    // 키 형태: "캐릭터ID-영역-스테이지번호-난이도"
    const map = {}
    for (const r of records) {
      const key = `${characterId}-${r.area}-${r.stage_index}-${r.difficulty}`
      map[key] = r
    }
    // 기존 맵에 새 데이터를 병합해요 (다른 영역 데이터는 유지)
    setProgressMap(prev => ({ ...prev, ...map }))
    return records
  }, [characterId, user])

  // getProgress: 특정 스테이지의 진도를 메모리에서 빠르게 가져와요
  const getProgress = useCallback((area, stageIndex, difficulty) => {
    if (!characterId) return null
    const key = `${characterId}-${area}-${stageIndex}-${difficulty}`
    return progressMap[key] || null
  }, [progressMap, characterId])

  // saveProgress: 스테이지를 클리어하면 별점을 Supabase에 저장해요
  const saveProgress = useCallback(async (area, stageIndex, difficulty, stars) => {
    if (!characterId || !user) return

    // 이미 클리어한 적 있는지 확인해요
    const { data: existing } = await supabase
      .from('progress')
      .select('id, stars')
      .eq('user_id', user.id)
      .eq('character_id', characterId)
      .eq('area', area)
      .eq('stage_index', stageIndex)
      .eq('difficulty', difficulty)
      .maybeSingle()

    if (existing) {
      // 이미 클리어한 적 있고, 새 점수가 더 높을 때만 업데이트해요 (최고점 보존)
      if (stars > existing.stars) {
        await supabase
          .from('progress')
          .update({
            stars,
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
    } else {
      // 처음 클리어하면 새로 저장해요
      // upsert를 사용해서 혹시 모를 중복을 방지해요
      await supabase.from('progress').upsert({
        user_id: user.id,
        character_id: characterId,
        area,
        stage_index: stageIndex,
        difficulty,
        stars,
        completed: true,
        completed_at: new Date().toISOString(),
      })
    }

    // 저장 후 해당 영역의 진도를 다시 불러와서 메모리를 최신 상태로 유지해요
    await loadProgress(area)
  }, [loadProgress, characterId, user])

  // isStageUnlocked: 특정 스테이지가 잠금 해제되어 있는지 확인해요
  // 규칙: easy → normal → hard 순서, 다음 스테이지는 이전 hard 클리어 후 열려요
  const isStageUnlocked = useCallback((area, stageIndex, difficulty) => {
    // 첫 번째 스테이지의 쉬움 난이도는 항상 열려 있어요
    if (stageIndex === 0 && difficulty === 'easy') return true

    if (difficulty === 'normal') {
      // 보통 난이도: 같은 스테이지 쉬움을 먼저 클리어해야 해요
      const p = getProgress(area, stageIndex, 'easy')
      return p?.completed || false
    }

    if (difficulty === 'hard') {
      // 어려움 난이도: 같은 스테이지 보통을 먼저 클리어해야 해요
      const p = getProgress(area, stageIndex, 'normal')
      return p?.completed || false
    }

    if (difficulty === 'easy' && stageIndex > 0) {
      // 다음 스테이지 쉬움: 이전 스테이지 어려움을 클리어해야 해요
      const p = getProgress(area, stageIndex - 1, 'hard')
      return p?.completed || false
    }

    return false
  }, [getProgress])

  // getStageStars: 특정 스테이지의 난이도별 별점을 가져와요
  const getStageStars = useCallback((area, stageIndex) => {
    const easy = getProgress(area, stageIndex, 'easy')
    const normal = getProgress(area, stageIndex, 'normal')
    const hard = getProgress(area, stageIndex, 'hard')
    // 각 난이도를 클리어했으면 1개씩 카운트해요
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

  // getAreaStats: 특정 영역 전체의 통계를 가져와요
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
