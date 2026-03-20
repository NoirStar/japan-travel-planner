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
  /** 로그인 후 복귀할 경로 (RequireAuth에서 설정) */
  pendingRedirect: string | null

  initialize: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, "nickname" | "avatar_url">>) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInAsDemo: () => void
  signOut: () => Promise<void>
  setShowLoginModal: (show: boolean) => void
  setPendingRedirect: (path: string | null) => void
  consumePendingRedirect: () => string | null
  refreshDemoProfile: () => void
  doAttendance: () => { success: boolean; alreadyDone: boolean }
  hasCheckedIn: () => boolean
}

let _initCalled = false

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  showLoginModal: false,
  isDemoMode: false,
  pendingRedirect: null,

  initialize: async () => {
    // 중복 호출 방지 (React StrictMode에서 effect 이중 실행)
    if (_initCalled) return
    _initCalled = true
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

      if (session?.user) {
        set({ session, user: session.user })
        await get().fetchProfile(session.user.id)
        set({ isLoading: false })
      } else {
        set({ session: null, user: null, isLoading: false })
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().fetchProfile(session.user.id)
          // 유저별 격리된 localStorage에서 다시 로드
          const { useScheduleStore } = await import("@/stores/scheduleStore")
          useScheduleStore.persist.rehydrate()
        } else {
          set({ profile: null })
          // 로그아웃 시 메모리 클리어
          const { useScheduleStore } = await import("@/stores/scheduleStore")
          useScheduleStore.setState({ trips: [], activeTripId: null })
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
      const profile = data as UserProfile
      // DB의 level과 total_points 기반 계산 레벨이 다르면 동기화
      const { calculateLevel } = await import("@/types/community")
      const expectedLevel = calculateLevel(profile.total_points ?? 0)
      if (profile.level !== expectedLevel) {
        profile.level = expectedLevel
        // 서버에도 동기화 시도
        void Promise.resolve(supabase.rpc("sync_my_level")).catch(() => {})
      }
      set({ profile })
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
        options: { redirectTo: window.location.href },
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
    // 데모 유저의 localStorage에서 여행 데이터 복원
    void import("@/stores/scheduleStore").then(({ useScheduleStore }) => {
      useScheduleStore.persist.rehydrate()
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
    // 여행 데이터 클리어 (메모리만 — 유저별 localStorage는 유지)
    const { useScheduleStore } = await import("@/stores/scheduleStore")
    useScheduleStore.setState({ trips: [], activeTripId: null })
  },

  setShowLoginModal: (show) => set({ showLoginModal: show }),

  setPendingRedirect: (path) => set({ pendingRedirect: path }),

  consumePendingRedirect: () => {
    const path = get().pendingRedirect
    set({ pendingRedirect: null })
    return path
  },

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
