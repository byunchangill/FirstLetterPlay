import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../db/dexie'

const CharacterContext = createContext(null)

export function CharacterProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [growth, setGrowth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const profiles = await db.profiles.toArray()
      if (profiles.length > 0) {
        const p = profiles[0]
        setProfile(p)
        const g = await db.characterGrowth
          .where('characterId')
          .equals(p.characterId)
          .first()
        setGrowth(g || null)
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoading(false)
    }
  }

  async function selectCharacter(characterId) {
    await db.profiles.clear()
    await db.characterGrowth.clear()
    await db.progress.clear()

    const id = await db.profiles.add({
      characterId,
      createdAt: new Date(),
    })

    const growthId = await db.characterGrowth.add({
      characterId,
      level: 1,
      exp: 0,
      trophies: [],
    })

    const newProfile = await db.profiles.get(id)
    const newGrowth = await db.characterGrowth.get(growthId)
    setProfile(newProfile)
    setGrowth(newGrowth)
    return newProfile
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
