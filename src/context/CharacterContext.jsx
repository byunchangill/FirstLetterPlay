// =====================================================
// 👤 CharacterContext.jsx - 내 캐릭터 정보를 관리하는 Context예요!
// 지금 선택한 캐릭터, 레벨, 경험치 등 정보를 전체 앱에서 사용할 수 있게 해줘요.
// 이전에는 브라우저(IndexedDB)에 저장했지만, 이제는 Supabase 클라우드에 저장해요!
// =====================================================

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// 캐릭터 정보를 전역으로 공유하는 Context
const CharacterContext = createContext(null)

export function CharacterProvider({ children }) {
  const { user } = useAuth()                 // 현재 로그인한 사용자 정보
  const [profile, setProfile] = useState(null)   // 내 캐릭터 프로필
  const [growth, setGrowth] = useState(null)     // 캐릭터 성장 정보 (레벨, 경험치 등)
  const [loading, setLoading] = useState(true)   // 데이터를 불러오는 중인지 여부

  // 로그인한 사용자가 바뀔 때마다 해당 사용자의 캐릭터를 불러와요
  useEffect(() => {
    if (user) {
      // 로그인되어 있으면 캐릭터 정보를 불러와요
      loadProfile(user.id)
    } else {
      // 로그아웃되면 상태를 초기화해요
      setProfile(null)
      setGrowth(null)
      setLoading(false)
    }
  }, [user])

  // loadProfile: Supabase에서 내 캐릭터 정보를 불러와요
  async function loadProfile(userId) {
    try {
      setLoading(true)

      // 1) 가장 최근에 선택한 캐릭터(activeCharacterId 설정값)를 확인해요
      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'activeCharacterId')
        .maybeSingle()

      const activeCharacterId = settingData?.value

      let targetCharacterId = null

      if (activeCharacterId) {
        // 활성 캐릭터가 설정되어 있으면 그걸 사용해요
        targetCharacterId = activeCharacterId
      } else {
        // 없으면 가장 최근에 만든 캐릭터를 찾아요
        const { data: profiles } = await supabase
          .from('profiles')
          .select('character_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (profiles && profiles.length > 0) {
          targetCharacterId = profiles[0].character_id
          // 찾은 캐릭터를 활성 캐릭터로 저장해둬요
          await supabase.from('settings').upsert({
            user_id: userId,
            key: 'activeCharacterId',
            value: targetCharacterId,
          })
        }
      }

      // 2) 캐릭터를 찾았으면 프로필과 성장 정보를 불러와요
      if (targetCharacterId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .eq('character_id', targetCharacterId)
          .maybeSingle()

        const { data: growthData } = await supabase
          .from('character_growth')
          .select('*')
          .eq('user_id', userId)
          .eq('character_id', targetCharacterId)
          .maybeSingle()

        setProfile(profileData || null)
        setGrowth(growthData || null)
      }
    } catch (e) {
      console.error('캐릭터 불러오기 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  // selectCharacter: 새로운 캐릭터를 선택해요
  // 처음 선택하는 캐릭터면 Supabase에 새로 만들어요
  async function selectCharacter(characterId) {
    if (!user) return null

    // 이미 이 캐릭터를 선택한 적 있는지 확인해요
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('character_id', characterId)
      .maybeSingle()

    let profileData = existingProfile

    if (!profileData) {
      // 처음 선택하는 캐릭터라면 새로 만들어요
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, character_id: characterId })
        .select()
        .maybeSingle()

      profileData = newProfile

      // 성장 정보도 처음부터 초기화해요 (레벨 1, 경험치 0)
      await supabase.from('character_growth').insert({
        user_id: user.id,
        character_id: characterId,
        level: 1,
        exp: 0,
        trophies: [],
      })
    }

    // 이 캐릭터를 활성 캐릭터로 저장해요
    await supabase.from('settings').upsert({
      user_id: user.id,
      key: 'activeCharacterId',
      value: characterId,
    })

    // 성장 정보를 다시 불러와요
    const { data: growthData } = await supabase
      .from('character_growth')
      .select('*')
      .eq('user_id', user.id)
      .eq('character_id', characterId)
      .maybeSingle()

    setProfile(profileData)
    setGrowth(growthData)
    return profileData
  }

  // addExp: 경험치를 추가해요. 경험치가 100이 되면 레벨업해요!
  async function addExp(amount) {
    if (!growth || !user) return growth

    const EXP_PER_LEVEL = 100
    let newExp = growth.exp + amount
    let newLevel = growth.level

    // 경험치가 100 이상이면 레벨을 올리고 경험치를 깎아요
    while (newExp >= EXP_PER_LEVEL) {
      newExp -= EXP_PER_LEVEL
      newLevel++
    }

    const leveledUp = newLevel > growth.level

    // Supabase에 업데이트해요
    const { data: updated } = await supabase
      .from('character_growth')
      .update({ exp: newExp, level: newLevel })
      .eq('user_id', user.id)
      .eq('character_id', growth.character_id)
      .select()
      .maybeSingle()

    setGrowth(updated)
    return { ...updated, leveledUp }
  }

  // addTrophy: 특정 영역(area)을 완전히 클리어했을 때 트로피를 줘요
  async function addTrophy(area) {
    if (!growth || !user) return
    // 이미 받은 트로피면 무시해요
    if (growth.trophies.includes(area)) return

    const newTrophies = [...growth.trophies, area]

    const { data: updated } = await supabase
      .from('character_growth')
      .update({ trophies: newTrophies })
      .eq('user_id', user.id)
      .eq('character_id', growth.character_id)
      .select()
      .maybeSingle()

    setGrowth(updated)
  }

  return (
    <CharacterContext.Provider
      value={{
        profile,
        growth,
        loading,
        selectCharacter,
        addExp,
        addTrophy,
        hasProfile: !!profile,
      }}
    >
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter() {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useCharacter must be used within CharacterProvider')
  return ctx
}
