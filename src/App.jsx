import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/Home'
import SelectPage from './pages/Select'
import WorldMapPage from './pages/WorldMap'
import StagePage from './pages/Stage'

export default function App() {
  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/select" element={<SelectPage />} />
          <Route path="/world" element={<WorldMapPage />} />
          <Route path="/world/:area" element={<WorldMapPage />} />
          <Route path="/stage/:area/:index" element={<StagePage />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
