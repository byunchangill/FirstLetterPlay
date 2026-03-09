// =====================================================
// 📌 App.jsx - 앱의 지도 역할을 해요!
// 주소에 따라 어떤 화면을 보여줄지 결정해줘요.
// 이제 로그인 여부에 따라 접근할 수 있는 화면이 달라져요!
// =====================================================

import { Routes, Route, Navigate } from 'react-router-dom'
// AnimatePresence: 화면이 바뀔 때 예쁜 전환 효과를 줘요
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import SelectPage from './pages/Select'      // 캐릭터 선택 화면
import WorldMapPage from './pages/WorldMap'  // 월드맵 / 스테이지 목록 화면
import StagePage from './pages/Stage'        // 실제 문제 푸는 화면
import LoginPage from './pages/Login'        // 로그인 화면

// ProtectedRoute: 로그인하지 않은 사람은 접근할 수 없는 화면을 감싸요
// 로그인 안 된 상태로 이 화면에 들어오면 /login으로 돌려보내요
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // 로그인 상태 확인 중에는 아무것도 보여주지 않아요 (깜빡임 방지)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-indigo-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">불러오는 중...</div>
      </div>
    )
  }

  // 로그인 안 된 상태면 로그인 페이지로 이동시켜요
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 로그인된 상태면 원래 화면을 보여줘요
  return children
}

export default function App() {
  return (
    <div className="min-h-screen">
      {/* AnimatePresence: 페이지 전환마다 애니메이션 효과 적용 */}
      <AnimatePresence mode="wait">
        <Routes>
          {/* /login → 구글 로그인 화면 (로그인 없이 접근 가능) */}
          <Route path="/login" element={<LoginPage />} />

          {/* 아래 화면들은 로그인해야만 볼 수 있어요 (ProtectedRoute로 감쌌어요) */}

          {/* / → 캐릭터 선택 화면으로 바로 이동 (홈 화면 없음) */}
          <Route path="/" element={
            <ProtectedRoute><Navigate to="/select" replace /></ProtectedRoute>
          } />

          {/* /select → 캐릭터 고르기 화면 */}
          <Route path="/select" element={
            <ProtectedRoute><SelectPage /></ProtectedRoute>
          } />

          {/* /world → 전체 월드맵 화면 */}
          <Route path="/world" element={
            <ProtectedRoute><WorldMapPage /></ProtectedRoute>
          } />

          {/* /world/consonants 처럼 특정 월드의 스테이지 목록 */}
          <Route path="/world/:area" element={
            <ProtectedRoute><WorldMapPage /></ProtectedRoute>
          } />

          {/* /stage/consonants/0 처럼 특정 스테이지 문제 화면 */}
          <Route path="/stage/:area/:index" element={
            <ProtectedRoute><StagePage /></ProtectedRoute>
          } />

          {/* 위의 어떤 주소도 아니면 홈으로 보내요 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
