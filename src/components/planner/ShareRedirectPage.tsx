import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadShareByCode } from "@/lib/shareUtils"
import { useScheduleStore } from "@/stores/scheduleStore"

export function ShareRedirectPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const loadedRef = useRef(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!shareCode || loadedRef.current) return
    loadedRef.current = true

    void (async () => {
      const trip = await loadShareByCode(shareCode)
      if (!trip) {
        setError("공유 링크가 만료되었거나 존재하지 않습니다")
        return
      }

      // 로컬 trip으로 생성 후 플래너로 이동
      const store = useScheduleStore.getState()
      const newTrip = store.createTrip(trip.cityId, trip.title)
      store.updateTrip(newTrip.id, {
        startDate: trip.startDate,
        endDate: trip.endDate,
      })

      // Days 구조 복원
      for (let i = 1; i < trip.days.length; i++) {
        store.addDay(newTrip.id)
      }
      const updatedTrip = store.trips.find((t) => t.id === newTrip.id)
      if (updatedTrip) {
        for (let di = 0; di < trip.days.length; di++) {
          const srcDay = trip.days[di]
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

      navigate(`/planner?trip=${newTrip.id}`, { replace: true })
    })()
  }, [shareCode, navigate])

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 bg-background text-foreground">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-semibold">{error}</p>
        <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl">
          홈으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
