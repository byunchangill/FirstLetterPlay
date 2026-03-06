// =====================================================
// 📌 App.jsx - 앱의 지도 역할을 해요!
// 주소에 따라 어떤 화면을 보여줄지 결정해줘요.
// 예: 주소가 /stage/... 이면 → 스테이지 화면 보여줌
// =====================================================

import { Routes, Route } from 'react-router-dom'
// AnimatePresence: 화면이 바뀔 때 예쁜 전환 효과를 줘요
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/Home'       // 시작 화면
import SelectPage from './pages/Select'   // 캐릭터 선택 화면
import WorldMapPage from './pages/WorldMap' // 월드맵 / 스테이지 목록 화면
import StagePage from './pages/Stage'     // 실제 문제 푸는 화면

export default function App() {
  return (
    <div className="min-h-screen">
      {/* AnimatePresence: 페이지 전환마다 애니메이션 효과 적용 */}
      <AnimatePresence mode="wait">
        <Routes>
          {/* / → 홈(시작) 화면 */}
          <Route path="/" element={<HomePage />} />
          {/* /select → 캐릭터 고르기 화면 */}
          <Route path="/select" element={<SelectPage />} />
          {/* /world → 전체 월드맵 화면 */}
          <Route path="/world" element={<WorldMapPage />} />
          {/* /world/consonants 처럼 특정 월드의 스테이지 목록 */}
          <Route path="/world/:area" element={<WorldMapPage />} />
          {/* /stage/consonants/0 처럼 특정 스테이지 문제 화면 */}
          <Route path="/stage/:area/:index" element={<StagePage />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
