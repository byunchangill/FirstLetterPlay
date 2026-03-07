// =====================================================
// 👤 CharacterContext.jsx - 내 캐릭터 정보를 관리하는 Context예요!
// 지금 선택한 캐릭터, 레벨, 경험치 등 정보를 전체 앱에서 사용할 수 있게 해줘요
// React Context를 사용해서 prop drilling을 없애요
// =====================================================

import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../db/dexie'

// 캐릭터 정보를 전역으로 공유하는 Context
const CharacterContext = createContext(null)

export function CharacterProvider({ children }) {
  const [profile, setProfile] = useState(null)  // 내 캐릭터 정보
  const [growth, setGrowth] = useState(null)  // 캐릭터 성장 정보 (레벨, 경험치 등)
  const [loading, setLoading] = useState(true)  // 데이터를 불러오는 중인지 여부

  // 앱이 시작될 때 저장된 캐릭터 정보를 불러와요
  useEffect(() => {
    loadProfile()
  }, [])

  // loadProfile: 저장된 캐릭터 정보를 불러와요
  async function loadProfile() {
    try {
      // 가장 최근에 선택한 캐릭터를 찾아요
      const activeSetting = await db.settings.get('activeCharacterId')
      const activeId = activeSetting?.value
      let p = null

      if (activeId) {
        p = await db.profiles.where('characterId').equals(activeId).first()
      }

      // 저장된 캐릭터가 없으면 가장 최근 캐릭터를 선택
      if (!p) {
        const profiles = await db.profiles.toArray()
        if (profiles.length > 0) {
          p = profiles[profiles.length - 1]
          await db.settings.put({ key: 'activeCharacterId', value: p.characterId })
        }
      }

      // 캐릭터를 찾았으면 성장 정보도 함께 불러와요
      if (p) {
        setProfile(p)
        const g = await db.characterGrowth
          .where('characterId')
          .equals(p.characterId)
          .first()
        setGrowth(g || null)
      } else {
        setProfile(null)
        setGrowth(null)
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoading(false)  // 불러오기 완료
    }
  }

  // selectCharacter: 새로운 캐릭터를 선택해요
  async function selectCharacter(characterId) {
    // 이미 있는 캐릭터인지 확인
    let p = await db.profiles.where('characterId').equals(characterId).first()

    if (!p) {
      // 새로운 캐릭터는 처음부터 만들어요
      const id = await db.profiles.add({
        characterId,
        createdAt: new Date(),
      })
      p = await db.profiles.get(id)

      // 성장 정보도 초기화해서 만들어요 (레벨 1, 경험치 0)
      await db.characterGrowth.add({
        characterId,
        level: 1,
        exp: 0,
        trophies: [],
      })
    }

    // 이 캐릭터를 활성화해요
    await db.settings.put({ key: 'activeCharacterId', value: characterId })
    const g = await db.characterGrowth.where('characterId').equals(characterId).first()

    setProfile(p)
    setGrowth(g)
    return p
  }

  async function addExp(amount) {
    if (!growth) return growth

    const EXP_PER_LEVEL = 100
    let newExp = growth.exp + amount
    let newLevel = growth.level

    while (newExp >= EXP_PER_LEVEL) {
      newExp -= EXP_PER_LEVEL
      newLevel++
    }

    const leveledUp = newLevel > growth.level

    await db.characterGrowth.update(growth.id, {
      exp: newExp,
      level: newLevel,
    })

    const updated = await db.characterGrowth.get(growth.id)
    setGrowth(updated)
    return { ...updated, leveledUp }
  }

  async function addTrophy(area) {
    if (!growth) return
    if (growth.trophies.includes(area)) return

    const newTrophies = [...growth.trophies, area]
    await db.characterGrowth.update(growth.id, { trophies: newTrophies })
    const updated = await db.characterGrowth.get(growth.id)
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
