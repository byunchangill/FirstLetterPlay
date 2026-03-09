// =====================================================
// 🔌 supabase.js - Supabase와 연결하는 클라이언트예요!
// 마치 인터넷 전화처럼, 이 파일이 있어야 Supabase DB와 대화할 수 있어요.
// 환경변수(.env 파일)에서 URL과 키를 가져와서 연결해요.
// =====================================================

import { createClient } from '@supabase/supabase-js'

// .env 파일에서 Supabase 주소와 공개 키를 가져와요
// (VITE_ 접두사가 있어야 브라우저에서 사용할 수 있어요)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 환경변수가 없으면 개발자가 .env 파일을 설정하지 않은 거예요
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '.env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 입력해주세요!'
  )
}

// Supabase 클라이언트를 만들어요 (앱 전체에서 이 하나를 공유해요)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
