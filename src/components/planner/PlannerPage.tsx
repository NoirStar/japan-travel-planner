import { useEffect, useRef, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityConfig } from "@/data/mapConfig"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getPlaceById } from "@/data/places"
import type { Place } from "@/types/place"

export function PlannerPage() {
  const [searchParams] = useSearchParams()
  const cityId = searchParams.get("city") ?? "tokyo"
  const cityConfig = getCityConfig(cityId)

  const { trips, createTrip, setActiveTrip } = useScheduleStore()
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const initialized = useRef(false)
  const [activeDayIndex, setActiveDayIndex] = useState(0)

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

  // 현재 Day의 장소 목록을 Place 객체로 변환
  const currentDayPlaces: Place[] = useMemo(() => {
    if (!trip) return []
    const day = trip.days[activeDayIndex]
    if (!day) return []
    return day.items
      .map((item) => getPlaceById(item.placeId))
      .filter((p): p is Place => p !== undefined)
  }, [trip, activeDayIndex])

  return (
    <div className="flex h-screen flex-col pt-16" data-testid="planner-page">
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="h-[40vh] w-full shrink-0 overflow-y-auto border-b border-border lg:h-full lg:w-[380px] lg:border-b-0 lg:border-r">
          <SchedulePanel
            cityId={cityId}
            activeDayIndex={activeDayIndex}
            onActiveDayIndexChange={setActiveDayIndex}
          />
        </aside>
        <main className="flex-1">
          <MapView
            center={cityConfig.center}
            zoom={cityConfig.zoom}
            places={currentDayPlaces}
          />
        </main>
      </div>
    </div>
  )
}
