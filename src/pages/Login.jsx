// =====================================================
// 🌟 Login.jsx - 학습을 시작하기 전 따뜻한 입장 화면이에요!
// 로그인 화면이 아니라, 아이들을 학습 세계로 초대하는 느낌으로 만들었어요.
// =====================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

// 배경에 둥둥 떠다니는 글자 블록 하나를 만드는 컴포넌트예요
// children: 보여줄 글자 (예: ㄱ, A, 1)
// style: 위치와 색상 스타일
// delay: 애니메이션 시작 딜레이 (블록마다 다르게 줘서 자연스럽게 보여요)
function FloatingBlock({ children, style, delay = 0 }) {
  return (
    <motion.div
      // 처음에 아래에 있다가 위로 올라오며 나타나요
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      // 위아래로 살살 흔들리는 반복 애니메이션
      style={style}
      className="absolute select-none pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3 + delay,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay * 0.5,
        }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center
                   text-white font-bold text-xl shadow-md"
        style={style.blockStyle}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// 캐릭터 이미지를 둥둥 띄우는 컴포넌트예요
function FloatingCharacter({ src, alt, style, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'backOut' }}
      style={style}
      className="absolute pointer-events-none"
    >
      <motion.img
        src={src}
        alt={alt}
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 3.5 + delay * 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay * 0.4,
        }}
        className="w-20 h-20 object-contain drop-shadow-md"
      />
    </motion.div>
  )
}

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogleLogin() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('앗! 로그인에 실패했어요. 다시 눌러볼까요?')
      setIsLoading(false)
    }
  }

  return (
    // 전체 화면 배경: 아주 연한 블루그레이 (#EDF4F8)
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: '#EDF4F8' }}
    >

      {/* ─── 배경 장식: 글자 블록들 ─── */}
      {/* 한글 자음 블록 */}
      <FloatingBlock delay={0.1} style={{ top: '8%', left: '6%', blockStyle: { backgroundColor: '#5B9BD5' } }}>ㄱ</FloatingBlock>
      <FloatingBlock delay={0.3} style={{ top: '14%', right: '8%', blockStyle: { backgroundColor: '#E07B5A' } }}>ㄴ</FloatingBlock>
      <FloatingBlock delay={0.5} style={{ bottom: '18%', left: '5%', blockStyle: { backgroundColor: '#68B88E' } }}>ㅏ</FloatingBlock>
      <FloatingBlock delay={0.2} style={{ bottom: '12%', right: '6%', blockStyle: { backgroundColor: '#D4789C' } }}>ㅗ</FloatingBlock>

      {/* 알파벳 블록 */}
      <FloatingBlock delay={0.4} style={{ top: '32%', left: '3%', blockStyle: { backgroundColor: '#7B7ED8' } }}>A</FloatingBlock>
      <FloatingBlock delay={0.6} style={{ top: '28%', right: '4%', blockStyle: { backgroundColor: '#E0A050' } }}>B</FloatingBlock>

      {/* 숫자 블록 */}
      <FloatingBlock delay={0.7} style={{ bottom: '35%', left: '7%', blockStyle: { backgroundColor: '#5CC8C8' } }}>1</FloatingBlock>
      <FloatingBlock delay={0.35} style={{ bottom: '40%', right: '5%', blockStyle: { backgroundColor: '#E06B6B' } }}>2</FloatingBlock>

      {/* ─── 배경 장식: 캐릭터들 ─── */}
      {/* 왼쪽 위: 다이노 */}
      <FloatingCharacter
        src="/images/characters/dino-1.png"
        alt="다이노"
        delay={0.2}
        style={{ top: '18%', left: '10%' }}
      />
      {/* 오른쪽 위: 로봇 */}
      <FloatingCharacter
        src="/images/characters/tobot-1.png"
        alt="로봇"
        delay={0.45}
        style={{ top: '16%', right: '9%' }}
      />
      {/* 왼쪽 아래: 공주 */}
      <FloatingCharacter
        src="/images/characters/elsa-1.png"
        alt="공주"
        delay={0.6}
        style={{ bottom: '22%', left: '8%' }}
      />
      {/* 오른쪽 아래: 요정 */}
      <FloatingCharacter
        src="/images/characters/hatchping-1.png"
        alt="요정"
        delay={0.35}
        style={{ bottom: '20%', right: '7%' }}
      />

      {/* ─── 메인 카드 ─── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xs flex flex-col items-center gap-6
                   rounded-[2.5rem] px-8 py-10"
        style={{
          backgroundColor: '#FFFDF9',
          // 부드럽고 입체감 있는 그림자 (SaaS 카드처럼 딱딱하지 않게)
          boxShadow: '0 8px 40px rgba(80, 100, 140, 0.13), 0 2px 8px rgba(80, 100, 140, 0.07)',
        }}
      >
        {/* 타이틀 영역: 로고 이미지 + 앱 이름 */}
        <div className="flex flex-col items-center gap-3">
          {/* 로고 이미지 */}
          <motion.img
            src="/images/ui/logo.png"
            alt="처음글자 놀이터 로고"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-36 h-36 object-contain drop-shadow-lg"
          />

          {/* 앱 제목 */}
          <h1
            className="text-3xl font-extrabold tracking-tight text-center leading-tight"
            style={{ color: '#1F2A44' }}
          >
            처음글자 놀이터
          </h1>

          {/* 설명 문구 */}
          <p
            className="text-sm text-center leading-relaxed"
            style={{ color: '#4E5B6B' }}
          >
            로그인하고 내 학습 기록을 이어가요!
          </p>
        </div>

        {/* 구글 로그인 버튼 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center gap-3
            rounded-2xl py-4 px-5
            text-base font-bold
            transition-all duration-200
            ${isLoading
              ? 'opacity-60 cursor-not-allowed'
              : 'cursor-pointer hover:brightness-95 active:brightness-90'
            }
          `}
          style={{
            // 버튼 배경: 따뜻한 노란빛 – "시작" 느낌
            backgroundColor: '#FFD84D',
            color: '#1F2A44',
            boxShadow: '0 4px 14px rgba(255, 200, 50, 0.35)',
          }}
        >
          {/* 구글 로고 */}
          {!isLoading && (
            <svg width="20" height="20" viewBox="0 0 48 48" className="flex-shrink-0">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
          )}
          {isLoading ? '잠깐만요...' : '구글로 학습 시작하기'}
        </motion.button>

        {/* 오류 메시지 */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-center px-4 py-2 rounded-xl"
            style={{ color: '#C0392B', backgroundColor: '#FEF0EE' }}
          >
            {error}
          </motion.p>
        )}

        {/* 하단 안내 문구 */}
        <p
          className="text-xs text-center leading-relaxed"
          style={{ color: '#8A97A8' }}
        >
          어떤 기기에서도 내 학습 기록을<br />이어갈 수 있어요.
        </p>
      </motion.div>
    </div>
  )
}
