// =====================================================
// 📌 main.jsx - 앱을 시작하는 제일 첫 번째 파일이에요!
// 마치 게임의 전원 버튼처럼, 이 파일이 실행되면 앱이 켜져요.
// =====================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
// BrowserRouter: 주소창의 /world, /stage 같은 주소를 읽어주는 도우미
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// AuthProvider: 구글 로그인 상태를 앱 어디서든 쓸 수 있게 해줘요 (가장 바깥에 감싸야 해요)
import { AuthProvider } from './context/AuthContext'
// CharacterProvider: 선택한 캐릭터 정보를 앱 어디서든 쓸 수 있게 해줘요
import { CharacterProvider } from './context/CharacterContext'
import './index.css'
// 오디오 캐시 모듈을 미리 로딩해요 (첫 터치 시 오디오 잠금 해제를 위해)
import './utils/audioCache'

// 🏁 앱을 HTML 페이지의 'root' 칸에 그려 넣어요
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode: 개발할 때 실수를 미리 잡아주는 안전망이에요
  <React.StrictMode>
    {/* BrowserRouter: 여러 페이지로 이동할 수 있게 해주는 포장지 */}
    <BrowserRouter>
      {/* AuthProvider: 로그인 정보를 앱 전체에 공유해줘요 (제일 바깥에 있어야 해요) */}
      <AuthProvider>
        {/* CharacterProvider: 캐릭터 정보를 앱 전체에 공유해줘요 */}
        <CharacterProvider>
          {/* App: 실제 앱 화면이에요 */}
          <App />
        </CharacterProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
