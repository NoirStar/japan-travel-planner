import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, Users, LogIn, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { joinTripByInvite, isCollabAvailable } from "@/services/tripSyncService"
import type { Trip } from "@/types/schedule"

type JoinState = "need-login" | "joining" | "error" | "unavailable"
type AsyncState = "idle" | "working" | "done"

export function JoinTripPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const { user, setShowLoginModal } = useAuthStore()
  const { trips, createTrip, setActiveTrip } = useScheduleStore()

  const [asyncState, setAsyncState] = useState<AsyncState>("idle")
  const [error, setError] = useState("")

  // 상태를 순수하게 계산 (effect 내 setState 불필요)
  const displayState = useMemo<JoinState>(() => {
    if (!inviteCode) return "error"
    if (!isCollabAvailable()) return "unavailable"
    if (!user) return "need-login"
    return "joining"
  }, [inviteCode, user])

  useEffect(() => {
    if (displayState !== "joining" || !inviteCode || !user || asyncState === "done") return

    let cancelled = false

    void (async () => {
      try {
        const result = await joinTripByInvite(inviteCode)

        if (cancelled) return

        // 이미 로컬에 해당 sharedId의 trip이 있는지 확인
        const existing = trips.find((t) => t.sharedId === result.tripId)
        if (existing) {
          setActiveTrip(existing.id)
          navigate(`/planner?trip=${existing.id}`, { replace: true })
          return
        }

        // 새 로컬 trip 생성
        const tripData = result.tripData as unknown as Trip
        const newTrip = createTrip(tripData.cityId || "tokyo", tripData.title || "공동 여행")
        const store = useScheduleStore.getState()

        // sharedId 설정 + trip 데이터 복원
        store.updateTrip(newTrip.id, {
          title: tripData.title,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          coverImage: tripData.coverImage,
        })

        // days 구조 복원
        const targetDayCount = tripData.days?.length ?? 1
        for (let i = 1; i < targetDayCount; i++) {
          store.addDay(newTrip.id)
        }

        const updatedTrip = store.trips.find((t) => t.id === newTrip.id)
        if (updatedTrip && tripData.days) {
          for (let di = 0; di < tripData.days.length; di++) {
            const srcDay = tripData.days[di]
            const tgtDay = updatedTrip.days[di]
            if (!srcDay || !tgtDay) continue
            for (const item of srcDay.items) {
              const newItem = store.addItem(newTrip.id, tgtDay.id, item.placeId)
              if (item.startTime || item.memo) {
                store.updateItem(newTrip.id, tgtDay.id, newItem.id, {
                  startTime: item.startTime,
                  memo: item.memo,
                })
              }
            }
          }
        }

        // sharedId 기록
        useScheduleStore.setState((s) => ({
          trips: s.trips.map((t) =>
            t.id === newTrip.id ? { ...t, sharedId: result.tripId } : t,
          ),
        }))

        navigate(`/planner?trip=${newTrip.id}`, { replace: true })
      } catch (e) {
        if (!cancelled) {
          setAsyncState("done")
          setError(e instanceof Error ? e.message : "참여에 실패했습니다")
        }
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inviteCode/user 변경 시만 재실행
  }, [displayState, inviteCode, user])

  // 에러 상태는 asyncState로 관리
  const effectiveState: string = asyncState === "done" && error ? "error" : displayState

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      {effectiveState === "joining" ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-sakura-dark" />
          <p className="text-sm text-muted-foreground">여행에 참여하는 중...</p>
        </>
      ) : effectiveState === "need-login" ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sakura-dark/10">
            <Users className="h-7 w-7 text-sakura-dark" />
          </div>
          <div>
            <h2 className="text-lg font-bold">공동 편집 초대</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              로그인 후 여행에 참여할 수 있습니다
            </p>
          </div>
          <Button
            onClick={() => setShowLoginModal(true)}
            className="gap-2 rounded-xl border-0 px-6 text-sm font-bold"
          >
            <LogIn className="h-4 w-4" />
            로그인
          </Button>
        </div>
      ) : effectiveState === "unavailable" ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
          <p className="text-sm text-muted-foreground">공동 편집 기능을 사용할 수 없습니다</p>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl">
            홈으로 돌아가기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold">{error || "잘못된 초대 링크입니다"}</p>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl">
            홈으로 돌아가기
          </Button>
        </div>
      )}
    </div>
  )
}
