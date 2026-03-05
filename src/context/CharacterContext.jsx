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
      const activeSetting = await db.settings.get('activeCharacterId')
      const activeId = activeSetting?.value
      let p = null

      if (activeId) {
        p = await db.profiles.where('characterId').equals(activeId).first()
      }

      if (!p) {
        const profiles = await db.profiles.toArray()
        if (profiles.length > 0) {
          p = profiles[profiles.length - 1]
          await db.settings.put({ key: 'activeCharacterId', value: p.characterId })
        }
      }

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
      setLoading(false)
    }
  }

  async function selectCharacter(characterId) {
    let p = await db.profiles.where('characterId').equals(characterId).first()

    if (!p) {
      const id = await db.profiles.add({
        characterId,
        createdAt: new Date(),
      })
      p = await db.profiles.get(id)

      await db.characterGrowth.add({
        characterId,
        level: 1,
        exp: 0,
        trophies: [],
      })
    }

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
