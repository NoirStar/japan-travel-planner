import { useEffect, useRef, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import {
  shareTrip as shareTripApi,
  saveTripToServer,
  loadTripFromServer,
  getMembers,
  getInviteCode,
  isCollabAvailable,
  type TripMember,
  type MemberRole,
} from "@/services/tripSyncService"
import type { Trip } from "@/types/schedule"
import type { RealtimeChannel } from "@supabase/supabase-js"

// ─── 원격 업데이트 플래그 (무한 루프 방지) ──────────────
let isRemoteUpdate = false

export interface OnlineMember {
  userId: string
  nickname: string
  avatarUrl: string | null
}

export interface CollaborativeSyncResult {
  isShared: boolean
  isConnected: boolean
  isSyncing: boolean
  myRole: MemberRole | null
  members: TripMember[]
  onlineMembers: OnlineMember[]
  inviteCode: string | null
  /** 현재 여행을 공유 모드로 전환 */
  shareTrip: () => Promise<string | null>
  /** 멤버 목록 새로고침 */
  refreshMembers: () => Promise<void>
}

const DEBOUNCE_MS = 800

export function useCollaborativeSync(trip: Trip | undefined): CollaborativeSyncResult {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [members, setMembers] = useState<TripMember[]>([])
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([])
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<MemberRole | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localVersionRef = useRef(0)

  const sharedId = trip?.sharedId
  const isShared = Boolean(sharedId)
  const available = isCollabAvailable()

  // ── 멤버 목록 로드 ────────────────────────────────────
  const refreshMembers = useCallback(async () => {
    if (!sharedId) return
    const list = await getMembers(sharedId)
    setMembers(list)
    if (user) {
      const me = list.find((m) => m.user_id === user.id)
      setMyRole(me?.role ?? null)
    }
  }, [sharedId, user])

  // ── 초대 코드 로드 ────────────────────────────────────
  useEffect(() => {
    if (!sharedId || !available) {
      setInviteCode(null)
      return
    }
    void getInviteCode(sharedId).then(setInviteCode)
    void refreshMembers()
  }, [sharedId, available, refreshMembers])

  // ── 서버에서 최신 상태 동기화 ─────────────────────────
  useEffect(() => {
    if (!sharedId || !trip || !available) return

    let cancelled = false

    async function catchUp() {
      const result = await loadTripFromServer(sharedId!)
      if (cancelled || !result) return

      if (result.version > localVersionRef.current) {
        localVersionRef.current = result.version
        const remoteTripData = result.tripData as unknown as Trip

        isRemoteUpdate = true
        useScheduleStore.getState().updateTrip(trip!.id, {
          title: remoteTripData.title,
          startDate: remoteTripData.startDate,
          endDate: remoteTripData.endDate,
          coverImage: remoteTripData.coverImage,
        })

        // day + items 동기화 — 전체 교체 방식
        useScheduleStore.setState((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== trip!.id) return t
            return {
              ...t,
              days: remoteTripData.days ?? t.days,
              reservations: remoteTripData.reservations ?? t.reservations,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
        isRemoteUpdate = false
      }
    }

    void catchUp()
    return () => { cancelled = true }
  }, [sharedId]) // trip.id는 의도적으로 제외 (sharedId 변경 시만 실행)

  // ── Realtime 채널 구독 ────────────────────────────────
  useEffect(() => {
    if (!sharedId || !user || !profile || !available) return

    const channelName = `collab:${sharedId}`

    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    })

    // Broadcast: 다른 사용자가 trip 데이터를 변경했을 때
    channel.on("broadcast", { event: "trip_updated" }, (payload) => {
      const msg = payload.payload as {
        senderId: string
        tripData: Trip
        version: number
      }

      // 자기 자신의 브로드캐스트 무시
      if (msg.senderId === user.id) return
      if (msg.version <= localVersionRef.current) return

      localVersionRef.current = msg.version

      isRemoteUpdate = true
      useScheduleStore.setState((state) => ({
        trips: state.trips.map((t) => {
          if (t.id !== trip?.id) return t
          return {
            ...t,
            ...msg.tripData,
            id: t.id, // 로컬 ID 유지
            sharedId: t.sharedId, // sharedId 유지
            updatedAt: new Date().toISOString(),
          }
        }),
      }))
      isRemoteUpdate = false
    })

    // Presence: 온라인 멤버 추적
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const online: OnlineMember[] = []
      for (const [, presences] of Object.entries(state)) {
        for (const p of presences as Array<{ userId: string; nickname: string; avatarUrl: string | null }>) {
          if (p.userId !== user.id) {
            online.push({ userId: p.userId, nickname: p.nickname, avatarUrl: p.avatarUrl })
          }
        }
      }
      setOnlineMembers(online)
    })

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true)
        await channel.track({
          userId: user.id,
          nickname: profile.nickname ?? "Unknown",
          avatarUrl: profile.avatar_url ?? null,
        })
      } else {
        setIsConnected(false)
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setIsConnected(false)
      setOnlineMembers([])
    }
  }, [sharedId, user?.id, profile?.nickname]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 로컬 변경 감지 → 서버 저장 + 브로드캐스트 ────────
  useEffect(() => {
    if (!sharedId || !trip || !user || !available) return
    if (myRole === "viewer") return

    const unsubscribe = useScheduleStore.subscribe(
      (state) => state.trips.find((t) => t.id === trip.id)?.updatedAt,
      (updatedAt) => {
        if (isRemoteUpdate || !updatedAt) return

        // 디바운스
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(async () => {
          const currentTrip = useScheduleStore.getState().trips.find((t) => t.id === trip.id)
          if (!currentTrip) return

          setIsSyncing(true)
          try {
            const newVersion = await saveTripToServer(sharedId, currentTrip)
            localVersionRef.current = newVersion

            // 다른 참여자에게 브로드캐스트
            channelRef.current?.send({
              type: "broadcast",
              event: "trip_updated",
              payload: {
                senderId: user.id,
                tripData: {
                  title: currentTrip.title,
                  cityId: currentTrip.cityId,
                  coverImage: currentTrip.coverImage,
                  startDate: currentTrip.startDate,
                  endDate: currentTrip.endDate,
                  days: currentTrip.days,
                  reservations: currentTrip.reservations,
                },
                version: newVersion,
              },
            })
          } catch {
            // 저장 실패 — 다음 변경에서 재시도
          } finally {
            setIsSyncing(false)
          }
        }, DEBOUNCE_MS)
      },
    )

    return () => {
      unsubscribe()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [sharedId, trip?.id, user?.id, myRole, available]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 공유 전환 ─────────────────────────────────────────
  const shareTripAction = useCallback(async (): Promise<string | null> => {
    if (!trip || !user || !available) return null

    try {
      const { sharedId: newSharedId, inviteCode: code } = await shareTripApi(trip, user.id)

      // Trip에 sharedId 기록
      useScheduleStore.setState((state) => ({
        trips: state.trips.map((t) =>
          t.id === trip.id ? { ...t, sharedId: newSharedId } : t,
        ),
      }))

      setInviteCode(code)
      void refreshMembers()

      return code
    } catch {
      return null
    }
  }, [trip, user, available, refreshMembers])

  return {
    isShared,
    isConnected,
    isSyncing,
    myRole,
    members,
    onlineMembers,
    inviteCode,
    shareTrip: shareTripAction,
    refreshMembers,
  }
}
