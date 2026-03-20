import { useEffect, useRef } from "react"
import { useAuthStore } from "@/stores/authStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { loadUserTrips, saveUserTrips } from "@/services/userTripSync"
import { isSupabaseConfigured } from "@/lib/supabase"

/**
 * 개인 여행 데이터를 Supabase user_trips 테이블과 동기화하는 훅.
 * - 로그인 시: 서버에서 최신 데이터 로드 (서버 우선)
 * - 로컬 변경 시: 디바운스 2초 후 서버에 자동 저장
 * App.tsx 최상위에서 한 번만 사용.
 */
export function useUserTripSync() {
  const user = useAuthStore((s) => s.user)
  const isDemoMode = useAuthStore((s) => s.isDemoMode)
  const isLoading = useAuthStore((s) => s.isLoading)

  const isSavingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // 서버 데이터를 스토어에 적용 중일 때 true → 재저장 방지
  const isApplyingServerDataRef = useRef(false)

  // ── 로그인 시 서버에서 불러오기 ─────────────────────────
  useEffect(() => {
    if (isLoading || !user || isDemoMode || !isSupabaseConfigured) return

    let cancelled = false

    async function syncFromServer() {
      const server = await loadUserTrips(user!.id)
      if (cancelled || !server) return

      const localTrips = useScheduleStore.getState().trips

      // 서버에 데이터가 있으면 서버 우선 적용
      if (server.trips.length > 0) {
        isApplyingServerDataRef.current = true
        useScheduleStore.setState({
          trips: server.trips,
          activeTripId: server.activeTripId,
        })
        // 다음 틱에서 플래그 해제 (zustand subscribe가 동기적으로 호출되므로)
        setTimeout(() => { isApplyingServerDataRef.current = false }, 0)
      } else if (localTrips.length > 0) {
        // 서버가 비어있고 로컬에 데이터가 있으면 → 초기 업로드
        await saveUserTrips(
          user!.id,
          localTrips,
          useScheduleStore.getState().activeTripId,
        )
      }
    }

    syncFromServer()
    return () => { cancelled = true }
  }, [user, isDemoMode, isLoading])

  // ── 로컬 변경 시 디바운스 저장 ──────────────────────────
  useEffect(() => {
    if (!user || isDemoMode || !isSupabaseConfigured) return

    const unsub = useScheduleStore.subscribe((state, prev) => {
      // 서버 데이터 적용 중에는 다시 저장하지 않음
      if (isApplyingServerDataRef.current) return
      // trips 또는 activeTripId가 바뀔 때만
      if (state.trips === prev.trips && state.activeTripId === prev.activeTripId) return

      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        if (isSavingRef.current) return
        isSavingRef.current = true
        try {
          const { trips, activeTripId } = useScheduleStore.getState()
          await saveUserTrips(user!.id, trips, activeTripId)
        } finally {
          isSavingRef.current = false
        }
      }, 2000)
    })

    return () => {
      unsub()
      clearTimeout(debounceRef.current)
    }
  }, [user, isDemoMode])
}
