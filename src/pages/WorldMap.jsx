import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { worlds, getWorldById } from '../data/worlds'
import { useCharacter } from '../context/CharacterContext'
import { useProgress } from '../hooks/useProgress'
import { getCharacterById } from '../data/characters'
import BackButton from '../components/common/BackButton'
import ProgressBar from '../components/common/ProgressBar'
import StarDisplay from '../components/common/StarDisplay'

export default function WorldMapPage() {
  const navigate = useNavigate()
  const { area } = useParams()
  const { profile, growth, loading } = useCharacter()
  const { loadProgress, getStageStars, getAreaStats, isStageUnlocked } = useProgress()
  const [loaded, setLoaded] = useState(false)

  const character = profile ? getCharacterById(profile.characterId) : null

  useEffect(() => {
    if (loading) return
    if (!profile) {
      navigate('/', { replace: true })
      return
    }

    async function load() {
      for (const w of worlds) {
        await loadProgress(w.id)
      }
      setLoaded(true)
    }
    load()
  }, [profile, navigate, loadProgress, loading])

  if (loading || !loaded || !character) return null

  if (area) {
    const world = getWorldById(area)
    if (!world) {
      navigate('/world')
      return null
    }
    return (
      <StageListView
        world={world}
        character={character}
        growth={growth}
        getStageStars={getStageStars}
        isStageUnlocked={isStageUnlocked}
        navigate={navigate}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-6 bg-gradient-to-b from-blue-100 to-green-50"
    >
      <div className="flex items-center justify-between mb-6">
        <BackButton to="/" />
        <button
          onClick={() => navigate('/select')}
          className="flex items-center gap-2 hover:bg-white/50 p-2 rounded-xl transition-colors cursor-pointer"
        >
          <span className="text-3xl">{character.emoji}</span>
          <span className="font-bold text-lg">Lv.{growth?.level || 1}</span>
        </button>
      </div>

      <h1 className="font-jua text-3xl md:text-4xl text-center text-gray-800 mb-6 drop-shadow-sm">
        어디로 갈까?
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        {worlds.map((world, i) => {
          const stats = getAreaStats(world.id, world.items.length)
          return (
            <motion.button
              key={world.id}
              initial={{ x: i % 2 === 0 ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/world/${world.id}`)}
              className="p-5 rounded-2xl shadow-lg text-left cursor-pointer"
              style={{ backgroundColor: world.bgColor }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{world.icon}</span>
                <div>
                  <h2 className="font-jua text-2xl text-gray-800">{world.name}</h2>
                  <p className="font-gaegu text-lg text-gray-600 leading-tight">{world.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>⭐ {stats.totalStars}/{stats.maxStars}</span>
                  <span>{stats.clearedStages}/{stats.totalStages} 클리어</span>
                </div>
                <ProgressBar
                  current={stats.clearedStages}
                  total={stats.totalStages}
                  color={world.color}
                />
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

function StageListView({ world, character, growth, getStageStars, isStageUnlocked, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-6"
      style={{ background: `linear-gradient(to bottom, ${world.bgColor}, #f8fafc)` }}
    >
      <div className="flex items-center gap-3 mb-6">
        <BackButton to="/world" />
        <span className="text-3xl">{world.icon}</span>
        <h1 className="font-jua text-3xl text-gray-800">{world.name}</h1>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-lg mx-auto">
        {world.items.map((item, index) => {
          const stars = getStageStars(world.id, index)
          const easyUnlocked = isStageUnlocked(world.id, index, 'easy')
          const label = world.getLabel(item)

          return (
            <motion.button
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring' }}
              whileTap={easyUnlocked ? { scale: 0.9 } : {}}
              onClick={() => easyUnlocked && navigate(`/stage/${world.id}/${index}`)}
              className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl shadow-md cursor-pointer ${easyUnlocked
                ? 'bg-white'
                : 'bg-gray-200 opacity-60 cursor-not-allowed'
                }`}
              style={easyUnlocked && stars.total > 0 ? { border: `3px solid ${world.color}` } : {}}
            >
              {!easyUnlocked && (
                <span className="text-2xl">🔒</span>
              )}
              <span className={`font-jua text-3xl md:text-4xl ${easyUnlocked ? 'text-gray-800' : 'text-gray-400'
                }`}>
                {label}
              </span>
              {easyUnlocked && stars.total > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {[stars.easy, stars.normal, stars.hard].map((s, di) => (
                    <span key={di} className="text-xs">
                      {s > 0 ? '⭐' : '☆'}
                    </span>
                  ))}
                </div>
              )}
              {easyUnlocked && stars.total === 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                  style={{ backgroundColor: world.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
