import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityConfig } from "@/data/mapConfig"
import { useScheduleStore } from "@/stores/scheduleStore"

export function PlannerPage() {
  const [searchParams] = useSearchParams()
  const cityId = searchParams.get("city") ?? "tokyo"
  const cityConfig = getCityConfig(cityId)

  const { trips, createTrip, setActiveTrip } = useScheduleStore()
  const initialized = useRef(false)

  // 플래너 진입 시 해당 도시의 Trip 자동 생성 (또는 기존 Trip 활성화)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const existingTrip = trips.find((t) => t.cityId === cityId)
    if (existingTrip) {
      setActiveTrip(existingTrip.id)
    } else {
      createTrip(cityId, `${cityConfig.name} 여행`)
    }
  }, [cityId, cityConfig.name, trips, createTrip, setActiveTrip])

  return (
    <div className="flex h-screen flex-col pt-16" data-testid="planner-page">
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="h-[40vh] w-full shrink-0 overflow-y-auto border-b border-border lg:h-full lg:w-[380px] lg:border-b-0 lg:border-r">
          <SchedulePanel cityId={cityId} />
        </aside>
        <main className="flex-1">
          <MapView center={cityConfig.center} zoom={cityConfig.zoom} />
        </main>
      </div>
    </div>
  )
}
