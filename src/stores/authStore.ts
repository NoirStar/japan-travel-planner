import { create } from "zustand"
import type { Session, User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import type { UserProfile } from "@/types/community"
import { DEMO_USER_ID, getDemoProfile, updateDemoProfile } from "@/lib/mockCommunity"

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
  signOut: () => Promise<void>
  setShowLoginModal: (show: boolean) => void
  refreshDemoProfile: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  showLoginModal: false,
  isDemoMode: false,

  initialize: async () => {
    // 데모 모드 복원
    if (localStorage.getItem("demo_logged_in") === "true") {
      const profile = getDemoProfile()
      set({
        user: { id: DEMO_USER_ID } as User,
        profile,
        isLoading: false,
        isDemoMode: true,
      })
      return
    }

    if (!isSupabaseConfigured) {
      set({ isLoading: false })
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, isLoading: false })

      if (session?.user) {
        await get().fetchProfile(session.user.id)
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().fetchProfile(session.user.id)
        } else {
          set({ profile: null })
        }
      })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchProfile: async (userId: string) => {
    if (get().isDemoMode) {
      set({ profile: getDemoProfile() })
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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
  },

  signInAsDemo: () => {
    const profile = getDemoProfile()
    localStorage.setItem("demo_logged_in", "true")
    set({
      user: { id: DEMO_USER_ID } as User,
      profile,
      isDemoMode: true,
      showLoginModal: false,
    })
  },

  signOut: async () => {
    if (get().isDemoMode) {
      localStorage.removeItem("demo_logged_in")
      set({ session: null, user: null, profile: null, isDemoMode: false })
      return
    }
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },

  setShowLoginModal: (show) => set({ showLoginModal: show }),

  refreshDemoProfile: () => {
    if (get().isDemoMode) {
      set({ profile: getDemoProfile() })
    }
  },
}))
