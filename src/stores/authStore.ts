import { create } from "zustand"
import type { Session, User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import type { UserProfile } from "@/types/community"
import {
  DEMO_USER_ID,
  ADMIN_USER_ID,
  getDemoProfile,
  getAdminProfile,
  updateDemoProfile,
  checkAttendance,
  hasCheckedInToday,
} from "@/lib/mockCommunity"

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  showLoginModal: boolean
  isDemoMode: boolean

  initialize: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, "nickname" | "avatar_url">>) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInAsDemo: () => void
  signInAsAdmin: () => Promise<void>
  signOut: () => Promise<void>
  setShowLoginModal: (show: boolean) => void
  refreshDemoProfile: () => void
  doAttendance: () => { success: boolean; alreadyDone: boolean }
  hasCheckedIn: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  showLoginModal: false,
  isDemoMode: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      // Supabase 미설정 시에만 localStorage 기반 복원
      if (localStorage.getItem("admin_logged_in") === "true") {
        set({
          user: { id: ADMIN_USER_ID } as User,
          profile: getAdminProfile(),
          isLoading: false,
          isDemoMode: true,
        })
        return
      }
      if (localStorage.getItem("demo_logged_in") === "true") {
        set({
          user: { id: DEMO_USER_ID } as User,
          profile: getDemoProfile(),
          isLoading: false,
          isDemoMode: true,
        })
        return
      }
      set({ isLoading: false })
      return
    }

    // 데모 모드 복원 (Supabase 설정되어도 데모는 mock 유지)
    if (localStorage.getItem("demo_logged_in") === "true") {
      set({
        user: { id: DEMO_USER_ID } as User,
        profile: getDemoProfile(),
        isLoading: false,
        isDemoMode: true,
      })
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, isLoading: false })

      if (session?.user) {
        await get().fetchProfile(session.user.id)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().fetchProfile(session.user.id)
        } else {
          set({ profile: null })
        }
      })
      // 구독 해제 함수를 window unload 시 호출
      window.addEventListener("beforeunload", () => subscription.unsubscribe(), { once: true })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchProfile: async (userId: string) => {
    if (get().isDemoMode) {
      const profile = get().profile
      if (profile?.is_admin) {
        set({ profile: getAdminProfile() })
      } else {
        set({ profile: getDemoProfile() })
      }
      return
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (data) {
      set({ profile: data as UserProfile })
    }
  },

  updateProfile: async (updates) => {
    const user = get().user
    if (!user) return

    if (get().isDemoMode) {
      if (get().profile?.is_admin) return // 관리자는 프로필 수정 불가
      const updated = updateDemoProfile(updates)
      set({ profile: updated })
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (!error) {
      await get().fetchProfile(user.id)
    }
  },

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      })
      if (error) {
        console.error("Google 로그인 실패:", error.message)
        if (error.message.includes("provider is not enabled")) {
          set({ showLoginModal: true })
        }
      }
    } catch (e) {
      console.error("Google 로그인 에러:", e)
    }
  },

  signInAsDemo: () => {
    const profile = getDemoProfile()
    localStorage.removeItem("admin_logged_in")
    localStorage.setItem("demo_logged_in", "true")
    set({
      user: { id: DEMO_USER_ID } as User,
      profile,
      isDemoMode: true,
      showLoginModal: false,
    })
  },

  signInAsAdmin: async () => {
    if (isSupabaseConfigured) {
      const email = import.meta.env.VITE_ADMIN_EMAIL as string | undefined
      const password = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
      if (email && password) {
        // 실제 Supabase 인증 — 데이터가 DB에 영속 저장됨
        let { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error?.message?.includes("Invalid login credentials")) {
          // 최초 사용: 계정 자동 생성
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: "관리자" } },
          })
          if (signUpError) {
            console.error("관리자 계정 생성 실패:", signUpError.message)
          } else if (signUpData.user) {
            // 프로필에 관리자 플래그 설정
            await supabase
              .from("profiles")
              .update({ is_admin: true, nickname: "관리자" })
              .eq("id", signUpData.user.id)
            data = signUpData as typeof data
            error = null
          }
        }
        if (!error && data?.user) {
          const profile = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single()
          set({
            user: data.user,
            session: data.session,
            profile: profile.data as UserProfile | null,
            isDemoMode: false,
            showLoginModal: false,
          })
          localStorage.removeItem("demo_logged_in")
          localStorage.removeItem("admin_logged_in")
          return
        }
      }
    }
    // Supabase 미설정 또는 인증 실패 시 기존 mock 폴백
    const profile = getAdminProfile()
    localStorage.removeItem("demo_logged_in")
    localStorage.setItem("admin_logged_in", "true")
    set({
      user: { id: ADMIN_USER_ID } as User,
      profile,
      isDemoMode: true,
      showLoginModal: false,
    })
  },

  signOut: async () => {
    if (get().isDemoMode) {
      localStorage.removeItem("demo_logged_in")
      localStorage.removeItem("admin_logged_in")
      set({ session: null, user: null, profile: null, isDemoMode: false })
    } else {
      await supabase.auth.signOut()
      set({ session: null, user: null, profile: null })
    }
    // 여행 데이터 클리어 & localStorage 삭제
    const { useScheduleStore } = await import("@/stores/scheduleStore")
    useScheduleStore.setState({ trips: [], activeTripId: null })
    localStorage.removeItem("schedule-store")
  },

  setShowLoginModal: (show) => set({ showLoginModal: show }),

  refreshDemoProfile: () => {
    if (get().isDemoMode) {
      const oldLevel = get().profile?.level ?? 1
      let newProfile: UserProfile
      if (get().profile?.is_admin) {
        newProfile = getAdminProfile()
      } else {
        newProfile = getDemoProfile()
      }
      set({ profile: newProfile })
      // 레벨업 감지 → 축하 이벤트
      if (newProfile.level > oldLevel) {
        import("@/components/ui/CelebrationOverlay").then(({ showLevelUp }) => {
          showLevelUp(newProfile.level)
        })
      }
    }
  },

  doAttendance: () => {
    if (!get().isDemoMode || get().profile?.is_admin) return { success: false, alreadyDone: true }
    const oldLevel = get().profile?.level ?? 1
    const result = checkAttendance()
    if (result.success) {
      const newProfile = getDemoProfile()
      set({ profile: newProfile })
      if (newProfile.level > oldLevel) {
        import("@/components/ui/CelebrationOverlay").then(({ showLevelUp }) => {
          showLevelUp(newProfile.level)
        })
      }
    }
    return result
  },

  hasCheckedIn: () => hasCheckedInToday(),
}))
