import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { worlds, getWorldById } from '../data/worlds'
import { useCharacter } from '../context/CharacterContext'
import { useProgress } from '../hooks/useProgress'
import { getCharacterById, getCharacterLevel } from '../data/characters'
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
        if (w.hasTabs) {
          for (const tab of w.tabs) {
            await loadProgress(`${w.id}_${tab.id}`)
          }
        } else {
          await loadProgress(w.id)
        }
      }
      setLoaded(true)
    }
    load()
  }, [profile, navigate, loadProgress, loading])

  if (loading || !loaded || !character) return null

  if (area) {
    const worldOrPseudo = getWorldById(area)
    if (!worldOrPseudo) {
      navigate('/world')
      return null
    }
    const isPseudo = !!worldOrPseudo.parentId
    const baseWorld = isPseudo ? getWorldById(worldOrPseudo.parentId) : worldOrPseudo
    const initialTab = isPseudo ? area.split('_')[1] : null

    return (
      <StageListView
        world={baseWorld}
        initialTab={initialTab}
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
          <img src={getCharacterLevel(character, growth?.level).image} alt={character.name} className="w-10 h-10 object-contain drop-shadow-sm" />
          <span className="font-bold text-lg">Lv.{growth?.level || 1}</span>
        </button>
      </div>

      <h1 className="font-jua text-3xl md:text-4xl text-center text-gray-800 mb-6 drop-shadow-sm">
        어디로 갈까?
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        {worlds.map((world, i) => {
          let stats
          if (world.hasTabs) {
            let ts = 0, ms = 0, cs = 0, tt = 0
            world.tabs.forEach(t => {
              const s = getAreaStats(`${world.id}_${t.id}`, world.items.length)
              ts += s.totalStars
              ms += s.maxStars
              cs += s.clearedStages
              tt += s.totalStages
            })
            stats = { totalStars: ts, maxStars: ms, clearedStages: cs, totalStages: tt }
          } else {
            stats = getAreaStats(world.id, world.items.length)
          }
          return (
            <motion.button
              key={world.id}
              initial={{ x: i % 2 === 0 ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/world/${world.id}`)}
              className="p-5 rounded-2xl shadow-lg border border-white/40 text-left cursor-pointer relative overflow-hidden group"
              style={{
                backgroundColor: world.bgColor,
              }}
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-300"></div>
              <div className="relative z-10 flex items-center gap-3 mb-3">
                {world.bgImage ? (
                  <img src={world.bgImage} alt={world.name} className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-sm" />
                ) : (
                  <span className="text-4xl">{world.icon}</span>
                )}
                <div>
                  <h2 className="font-jua text-2xl text-gray-800">{world.name}</h2>
                  <p className="font-gaegu text-lg text-gray-600 leading-tight">{world.description}</p>
                </div>
              </div>
              <div className="relative z-10 space-y-2">
                <div className="flex justify-between text-sm text-gray-700 bg-white/60 px-2 py-0.5 rounded backdrop-blur-sm font-bold">
                  <span className="flex items-center gap-1"><img src="/images/ui/star-filled.png" className="w-4 h-4" /> {stats.totalStars}/{stats.maxStars}</span>
                  <span>{stats.clearedStages}/{stats.totalStages} 클리어</span>
                </div>
                <div className="relative z-10">
                  <ProgressBar
                    current={stats.clearedStages}
                    total={stats.totalStages}
                    color={world.color}
                  />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

function StageListView({ world, initialTab, character, growth, getStageStars, isStageUnlocked, navigate }) {
  const [activeTab, setActiveTab] = useState(initialTab || (world.hasTabs ? world.tabs[0].id : null))
  const isTabbed = world.hasTabs
  const currentWorldId = activeTab ? `${world.id}_${activeTab}` : world.id
  const currentWorld = activeTab ? getWorldById(currentWorldId) : world

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-6"
      style={{ background: `linear-gradient(to bottom, ${currentWorld.bgColor || world.bgColor}, #f8fafc)` }}
    >
      <div className="flex items-center gap-3 mb-6">
        <BackButton to="/world" />
        {world.bgImage ? (
          <img src={world.bgImage} alt={world.name} className="w-10 h-10 object-contain drop-shadow-sm" />
        ) : (
          <span className="text-3xl">{world.icon}</span>
        )}
        <h1 className="font-jua text-3xl text-gray-800">{world.name}</h1>
      </div>

      {isTabbed && (
        <div className="flex gap-2 justify-center mb-6">
          {world.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-full font-jua text-xl transition-all ${activeTab === tab.id ? 'bg-white shadow-md text-gray-800 scale-105' : 'bg-white/40 text-gray-600 hover:bg-white/60'}`}
              style={activeTab === tab.id ? { color: tab.color } : {}}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-lg mx-auto">
        {currentWorld.items.map((item, index) => {
          const stars = getStageStars(currentWorld.id, index)
          const easyUnlocked = isStageUnlocked(currentWorld.id, index, 'easy')
          const label = currentWorld.getLabel(item)

          return (
            <motion.button
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring' }}
              whileTap={easyUnlocked ? { scale: 0.9 } : {}}
              onClick={() => easyUnlocked && navigate(`/stage/${currentWorld.id}/${index}`)}
              className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl shadow-md cursor-pointer ${easyUnlocked
                ? 'bg-white'
                : 'bg-gray-200 opacity-60 cursor-not-allowed'
                }`}
              style={easyUnlocked && stars.total > 0 ? { border: `3px solid ${currentWorld.color}` } : {}}
            >
              {!easyUnlocked && (
                <img src="/images/ui/lock.png" alt="locked" className="w-8 h-8 object-contain mb-1 opacity-80" />
              )}
              <span className={`font-jua text-3xl md:text-4xl ${easyUnlocked ? 'text-gray-800' : 'text-gray-400'
                }`}>
                {label}
              </span>
              {easyUnlocked && stars.total > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {[stars.easy, stars.normal, stars.hard].map((s, di) => (
                    <img key={di} src={s > 0 ? '/images/ui/star-filled.png' : '/images/ui/star-empty.png'} className="w-4 h-4" alt={s > 0 ? 'star' : 'empty star'} />
                  ))}
                </div>
              )}
              {easyUnlocked && stars.total === 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentWorld.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
