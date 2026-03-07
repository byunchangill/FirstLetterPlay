// =====================================================
// 📌 WorldMap.jsx - 어떤 공부를 할지 고르는 세계 지도 화면이에요!
// 크게 두 가지 화면이 있어요:
//   1) 월드 목록: 자음, 모음, 숫자, 알파벳 중 하나를 골라요
//   2) 스테이지 목록: 선택한 월드의 글자들이 잠금/별 표시로 나와요
// =====================================================

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { worlds, getWorldById } from '../data/worlds'
import { useCharacter } from '../context/CharacterContext'
import { useProgress } from '../hooks/useProgress'
import { getCharacterById, getCharacterLevel } from '../data/characters'
import { preloadAudioList } from '../utils/audioCache'
import BackButton from '../components/common/BackButton'
import ProgressBar from '../components/common/ProgressBar'
import StarDisplay from '../components/common/StarDisplay'

export default function WorldMapPage() {
  const navigate = useNavigate()
  // area: 주소창에서 어떤 월드인지 읽어요 (예: /world/consonants → area = 'consonants')
  const { area } = useParams()
  // profile: 내 캐릭터 정보, growth: 레벨/경험치 정보, loading: 불러오는 중 여부
  const { profile, growth, loading } = useCharacter()
  const { loadProgress, getStageStars, getAreaStats, isStageUnlocked } = useProgress()
  // loaded: 모든 저장 데이터를 불러왔는지 여부
  const [loaded, setLoaded] = useState(false)

  // profile에서 캐릭터 정보를 가져와요
  const character = profile ? getCharacterById(profile.characterId) : null

  // 화면이 처음 켜질 때 저장된 학습 진도를 불러와요
  useEffect(() => {
    if (loading) return
    // 캐릭터가 없으면 시작 화면으로 돌아가요
    if (!profile) {
      navigate('/', { replace: true })
      return
    }

    // 모든 월드의 진도를 데이터베이스에서 불러와요
    async function load() {
      for (const w of worlds) {
        if (w.hasTabs) {
          // 탭이 있는 월드(예: 자음/모음)는 탭마다 따로 불러요
          for (const tab of w.tabs) {
            await loadProgress(`${w.id}_${tab.id}`)
          }
        } else {
          await loadProgress(w.id)
        }
      }
      setLoaded(true)  // 다 불러오면 화면을 보여줘요
    }
    load()
  }, [profile, navigate, loadProgress, loading])

  // 아직 데이터를 불러오는 중이면 아무것도 안 보여줘요
  if (loading || !loaded || !character) return null

  // 주소에 area가 있으면 → 스테이지 목록 화면을 보여줘요
  if (area) {
    const worldOrPseudo = getWorldById(area)
    if (!worldOrPseudo) {
      navigate('/world')
      return null
    }
    // 탭 월드(예: consonants_초성)인지 확인해요
    const isPseudo = !!worldOrPseudo.parentId
    const baseWorld = isPseudo ? getWorldById(worldOrPseudo.parentId) : worldOrPseudo
    const initialTab = isPseudo ? area.split('_')[1] : null

    // 스테이지 목록 화면으로 이동해요
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

  // area가 없으면 → 월드 목록 화면을 보여줘요
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-6 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #EDF4F8 0%, #F7FBFC 100%)' }}
    >
      {/* 상단 헤더: 뒤로 가기 + 내 캐릭터/레벨 표시 */}
      <div className="flex items-center justify-between mb-6">
        <BackButton to="/" />
        {/* 내 캐릭터를 누르면 캐릭터 선택 화면으로 가요 */}
        <button
          onClick={() => navigate('/select')}
          className="flex items-center gap-2 p-2 rounded-xl transition-colors cursor-pointer"
          style={{
            background: 'var(--badge-bg)',
            border: '1.5px solid var(--badge-border)',
            borderRadius: '14px',
          }}
        >
          {/* 현재 레벨에 맞는 캐릭터 이미지 */}
          <img src={getCharacterLevel(character, growth?.level).image} alt={character.name} className="w-10 h-10 object-contain drop-shadow-sm" />
          <span className="font-jua text-lg" style={{ color: 'var(--text-title)' }}>Lv.{growth?.level || 1}</span>
        </button>
      </div>

      {/* 월드 카드 영역 - 태블릿/PC에서 수직 중앙 배치 (md: 768px 이상) */}
      <div className="flex-1 flex items-start md:items-center">
      <div className="w-full">
      <h1 className="font-jua text-3xl md:text-4xl text-center text-[#1F2A44] mb-6 drop-shadow-sm">
        어디로 갈까?
      </h1>

      {/* 월드 카드 목록 (자음, 모음, 숫자, 알파벳 등) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg md:max-w-2xl mx-auto">
        {worlds.map((world, i) => {
          // 이 월드에서 획득한 별/클리어 개수를 계산해요
          let stats
          if (world.hasTabs) {
            // 탭이 있는 월드는 각 탭의 통계를 모두 더해요
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
            // 월드 카드 버튼 (좌우에서 날아오는 애니메이션)
            <motion.button
              key={world.id}
              initial={{ x: i % 2 === 0 ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/world/${world.id}`)}  // 누르면 스테이지 목록으로 이동
              className="p-5 rounded-[28px] text-left cursor-pointer relative overflow-hidden group"
              style={{
                backgroundColor: world.bgColor,
                border: '2px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              {/* 마우스를 올리면 흰색 빛이 사라지는 효과 */}
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-300"></div>
              {/* 월드 아이콘 + 이름 + 설명 */}
              <div className="relative z-10 flex items-center gap-3 mb-3">
                {world.bgImage ? (
                  <img src={world.bgImage} alt={world.name} className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-sm" />
                ) : (
                  <span className="text-4xl">{world.icon}</span>
                )}
                <div>
                  <h2 className="font-jua text-2xl" style={{ color: 'var(--text-title)' }}>{world.name}</h2>
                  <p className="font-pretendard text-base leading-tight" style={{ color: 'var(--text-body)' }}>{world.description}</p>
                </div>
              </div>
              {/* 별 개수와 클리어 개수, 진행 막대 */}
              <div className="relative z-10 space-y-2">
                <div
                  className="flex justify-between text-sm px-2 py-1 rounded-lg font-pretendard font-semibold"
                  style={{ background: 'var(--card-inner)', color: 'var(--text-meta)' }}
                >
                  <span className="flex items-center gap-1"><img src="/images/ui/star-filled.png" className="w-4 h-4" /> {stats.totalStars}/{stats.maxStars}</span>
                  <span>{stats.clearedStages}/{stats.totalStages} 완료</span>
                </div>
                <div className="relative z-10">
                  {/* 얼마나 진행했는지 보여주는 막대예요 */}
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
      </div>
      </div>
    </motion.div>
  )
}

// =====================================================
// 나라별 타일 색상 정보예요
// 각 나라마다 타일 배경/테두리/호버/잠금 색이 달라요
// index.css의 --world-* CSS 변수로 그리드에 주입돼요
// =====================================================
// =====================================================
// 나라별 타일 색상 전체 세트예요
// 기본(locked/tile) + 인터랙션(hover/selected/completed/new) 모두 포함해요
// 이 값들은 그리드 wrapper의 --world-* CSS 변수로 자식 타일에 전달돼요
// =====================================================
const WORLD_TILE_COLORS = {
  consonants: {
    // 기본 상태
    tile:       '#FFFDF9',   // 잠금해제 기본 배경
    locked:     '#F1F3EF',   // 잠긴 타일 배경
    lockedText: '#B8BDB5',   // 잠긴 타일 글자색
    // Hover (마우스 올림 - 살짝 강조)
    hoverBg:     '#F6FBF4',
    hoverBorder: '#36A63A',
    hoverShadow: 'rgba(69, 182, 73, 0.14)',
    // Selected (누르는 중 - 가장 강한 강조)
    selectedBg:     '#ECF9E7',
    selectedBorder: '#2F9E38',
    selectedRing:   '#BEE7B7',
    selectedShadow: 'rgba(69, 182, 73, 0.20)',
    // Completed (이미 플레이함 - 안정적 강조)
    completedBg:     '#F3FBF1',
    completedBorder: '#78C97A',
    // New / Just Unlocked (아직 안 해봄 - 반짝임)
    unlockBg:     '#F7FDF5',
    unlockBorder: '#57C95D',
    unlockRing:   '#D7F2D2',
    unlockShadow: 'rgba(87, 201, 93, 0.22)',
  },
  vowels: {
    tile:       '#FFFDF9',
    locked:     '#EEF1F4',
    lockedText: '#B6BEC8',
    hoverBg:     '#F5FAFE',
    hoverBorder: '#1F7DDA',
    hoverShadow: 'rgba(45, 142, 234, 0.14)',
    selectedBg:     '#EAF5FF',
    selectedBorder: '#1D78D8',
    selectedRing:   '#B8DCFF',
    selectedShadow: 'rgba(45, 142, 234, 0.20)',
    completedBg:     '#F1F8FE',
    completedBorder: '#75B6F2',
    unlockBg:     '#F6FBFF',
    unlockBorder: '#4C9EF0',
    unlockRing:   '#D8ECFA',
    unlockShadow: 'rgba(76, 158, 240, 0.22)',
  },
  numbers: {
    tile:       '#FFFDF9',
    locked:     '#F3F0E7',
    lockedText: '#BDB7AC',
    hoverBg:     '#FFF9ED',
    hoverBorder: '#E18E08',
    hoverShadow: 'rgba(245, 158, 11, 0.15)',
    selectedBg:     '#FFF6DB',
    selectedBorder: '#D98900',
    selectedRing:   '#F7D98A',
    selectedShadow: 'rgba(245, 158, 11, 0.22)',
    completedBg:     '#FFFAF0',
    completedBorder: '#F2B64A',
    unlockBg:     '#FFFBF2',
    unlockBorder: '#F2AA22',
    unlockRing:   '#F9E5AE',
    unlockShadow: 'rgba(242, 170, 34, 0.24)',
  },
  alphabet: {
    tile:       '#FFFDF9',
    locked:     '#F3EEE8',
    lockedText: '#BDB5AE',
    hoverBg:     '#FFF5EF',
    hoverBorder: '#F45A20',
    hoverShadow: 'rgba(255, 107, 53, 0.15)',
    selectedBg:     '#FFF0E8',
    selectedBorder: '#E85A24',
    selectedRing:   '#FFC9B5',
    selectedShadow: 'rgba(255, 107, 53, 0.22)',
    completedBg:     '#FFF7F2',
    completedBorder: '#F49A78',
    unlockBg:     '#FFF8F3',
    unlockBorder: '#FF7A4A',
    unlockRing:   '#FFD8C9',
    unlockShadow: 'rgba(255, 122, 74, 0.24)',
  },
}

// =====================================================
// StageListView - 특정 월드의 스테이지 목록을 보여줘요
// 예: 자음 월드를 누르면 ㄱ, ㄴ, ㄷ... 버튼이 쭉 나와요
// 잠긴 스테이지는 자물쇠 🔒가 보이고, 클리어한 건 별이 표시돼요
// =====================================================
function StageListView({ world, initialTab, character, growth, getStageStars, isStageUnlocked, navigate }) {
  // activeTab: 현재 선택된 탭 (예: 초성 / 받침)
  const [activeTab, setActiveTab] = useState(initialTab || (world.hasTabs ? world.tabs[0].id : null))
  const isTabbed = world.hasTabs  // 탭이 있는 월드인지 여부
  const currentWorldId = activeTab ? `${world.id}_${activeTab}` : world.id
  const currentWorld = activeTab ? getWorldById(currentWorldId) : world  // 현재 보여줄 월드 정보

  // 이 나라의 타일 색상 정보를 가져와요
  // world.id가 consonants / vowels / numbers / alphabet 중 하나예요
  const tileColors = WORLD_TILE_COLORS[world.id] || WORLD_TILE_COLORS.consonants

  // 스테이지 목록이 보이는 동안 이 월드의 모든 오디오를 미리 받아놔요
  // → 스테이지 진입 시 이미 로딩 완료 상태!
  useEffect(() => {
    if (!currentWorld || !currentWorld.items || !character) return
    const charId = character.id
    const paths = []
    currentWorld.items.forEach(wItem => {
      if (currentWorld.getSpelAudioUrl) paths.push(currentWorld.getSpelAudioUrl(wItem, charId))
      if (currentWorld.getWordAudioUrl) paths.push(currentWorld.getWordAudioUrl(wItem, charId))
    })
    preloadAudioList(paths.filter(Boolean))
  }, [currentWorld, character])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-6 flex flex-col"
      style={{ background: `linear-gradient(to bottom, ${currentWorld.bgColor || world.bgColor}, #f8fafc)` }}
    >
      {/* 상단: 뒤로 가기 + 월드 아이콘 + 이름 (오른쪽 정렬) */}
      <div className="flex items-center mb-6">
        <BackButton to="/world" />
        <div className="ml-auto flex items-center gap-2">
          {world.bgImage ? (
            <img src={world.bgImage} alt={world.name} className="w-10 h-10 object-contain drop-shadow-sm" />
          ) : (
            <span className="text-3xl">{world.icon}</span>
          )}
          <h1 className="font-jua text-3xl text-gray-800">{world.name}</h1>
        </div>
      </div>

      {/* 탭이 있는 월드(예: 자음)는 탭 버튼을 보여줘요 (초성 / 받침) */}
      {isTabbed && (
        <div className="flex gap-2 justify-center mb-6">
          {world.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-full font-jua text-xl transition-all ${activeTab === tab.id ? 'text-gray-800 scale-105' : 'bg-white/40 text-gray-600 hover:bg-white/60'}`}
              style={activeTab === tab.id ? {
                background: 'var(--surface)',
                border: '2px solid var(--border-warm)',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.8), 0 3px 8px rgba(80,80,80,0.08)',
                color: tab.color,
              } : {}}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      {/* 글자 버튼들 - 태블릿/PC에서 수직 중앙 배치 (md: 768px 이상) */}
      <div className="flex-1 flex items-start md:items-center">
      {/*
        그리드 wrapper에 나라별 타일 CSS 변수를 설정해요.
        자식 버튼들은 var(--world-tile-bg) 등으로 이 값을 읽어요.
      */}
      <div
        className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 max-w-lg md:max-w-2xl mx-auto w-full"
        style={{
          /* 기본 상태 */
          '--world-tile-bg':    tileColors.tile,
          '--world-locked-bg':  tileColors.locked,
          '--world-locked-text': tileColors.lockedText,
          /* Hover 상태 */
          '--world-hover-bg':     tileColors.hoverBg,
          '--world-hover-border': tileColors.hoverBorder,
          '--world-hover-shadow': tileColors.hoverShadow,
          /* Selected (Active) 상태 */
          '--world-selected-bg':     tileColors.selectedBg,
          '--world-selected-border': tileColors.selectedBorder,
          '--world-selected-ring':   tileColors.selectedRing,
          '--world-selected-shadow': tileColors.selectedShadow,
          /* Completed 상태 */
          '--world-completed-bg':     tileColors.completedBg,
          '--world-completed-border': tileColors.completedBorder,
          /* New (Just Unlocked) 상태 */
          '--world-unlock-bg':     tileColors.unlockBg,
          '--world-unlock-border': tileColors.unlockBorder,
          '--world-unlock-ring':   tileColors.unlockRing,
          '--world-unlock-shadow': tileColors.unlockShadow,
        }}
      >
        {currentWorld.items.map((item, index) => {
          const stars = getStageStars(currentWorld.id, index)  // 이 스테이지에서 딴 별 정보
          const easyUnlocked = isStageUnlocked(currentWorld.id, index, 'easy')  // 잠금 해제됐는지
          const label = currentWorld.getLabel(item)  // 버튼에 표시할 글자 (예: ㄱ)

          return (
            <motion.button
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring' }}
              whileTap={easyUnlocked ? { scale: 0.9 } : {}}
              // 잠금 해제된 스테이지만 눌러서 이동할 수 있어요
              onClick={() => easyUnlocked && navigate(`/stage/${currentWorld.id}/${index}`)}
              className={`stage-tile relative flex flex-col items-center justify-center w-full aspect-square rounded-[24px] ${
                !easyUnlocked
                  // 잠긴 타일: 어두운 배경, 클릭 불가
                  ? 'stage-tile--locked cursor-not-allowed'
                  : stars.total > 0
                    // 완료 타일: 안정적인 색채움 + 나라 색 테두리
                    ? 'stage-tile--unlocked stage-tile--completed cursor-pointer'
                    // 새 타일 (아직 안 해봄): 살짝 반짝이는 링 효과
                    : 'stage-tile--unlocked stage-tile--new cursor-pointer'
              }`}
              // border/boxShadow는 CSS 클래스(stage-tile--*)가 담당해요
              // → 인라인 스타일 없이도 :hover, :active CSS가 동작해요
            >
              {/* 잠긴 스테이지에는 자물쇠 그림이 나와요 */}
              {!easyUnlocked && (
                <img src="/images/ui/lock.png" alt="locked" className="w-8 h-8 object-contain mb-1" style={{ opacity: 0.7 }} />
              )}
              {/* 글자 (예: ㄱ, a, 1) - tile-label 클래스로 CSS가 색상을 제어해요 */}
              <span className="tile-label font-jua text-3xl md:text-4xl lg:text-5xl">
                {label}
              </span>
              {/* 클리어한 스테이지에는 별 3개가 보여요 (색 별 = 달성, 빈 별 = 미달성) */}
              {easyUnlocked && stars.total > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {[stars.easy, stars.normal, stars.hard].map((s, di) => (
                    <img key={di} src={s > 0 ? '/images/ui/star-filled.png' : '/images/ui/star-empty.png'} className="w-4 h-4" alt={s > 0 ? 'star' : 'empty star'} />
                  ))}
                </div>
              )}
              {/* 한 번도 안 한 스테이지에는 반짝이는 점이 생겨요 */}
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
      </div>
    </motion.div>
  )
}
