// =====================================================
// 🔐 AuthContext.jsx - 로그인 상태를 관리하는 Context예요!
// 지금 로그인된 사용자가 누구인지, 로그인/로그아웃 기능을 전체 앱에 제공해요.
// =====================================================

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 로그인 정보를 전역으로 공유하는 Context
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // user: 현재 로그인한 사용자 정보 (null이면 로그인 안 된 상태)
  const [user, setUser] = useState(null)
  // loading: 앱 시작 시 이미 로그인되어 있는지 확인하는 중
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1) 앱이 켜질 때 이미 로그인되어 있는 세션을 확인해요
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2) 로그인/로그아웃이 일어날 때마다 자동으로 user 상태를 업데이트해요
    // (구글 로그인 후 리다이렉트되어도 자동으로 감지해요)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // 컴포넌트가 사라질 때 구독을 해제해요 (메모리 누수 방지)
    return () => subscription.unsubscribe()
  }, [])

  // signInWithGoogle: 구글 로그인 팝업을 열어요
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 로그인 후 돌아올 주소 (현재 페이지 주소를 사용)
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      console.error('구글 로그인 실패:', error.message)
      throw error
    }
  }

  // signOut: 로그아웃해요
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('로그아웃 실패:', error.message)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,          // 현재 사용자 정보 (null이면 로그인 안 된 상태)
        loading,       // 세션 확인 중 여부
        signInWithGoogle,
        signOut,
        isLoggedIn: !!user,  // 로그인 여부를 간단하게 확인하는 편의 속성
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// useAuth: 다른 컴포넌트에서 로그인 정보를 쉽게 가져오는 훅
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
