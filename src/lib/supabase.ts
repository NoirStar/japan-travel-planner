import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// 환경변수 미설정 시에도 앱이 크래시하지 않도록 더미 클라이언트 생성
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
