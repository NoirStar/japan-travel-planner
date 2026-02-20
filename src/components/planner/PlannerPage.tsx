import { useEffect, useRef, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { List, MapIcon } from "lucide-react"
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
  const [mobileTab, setMobileTab] = useState<"schedule" | "map">("schedule")

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
    <div className="flex h-screen flex-col pt-14" data-testid="planner-page">
      {/* 데스크톱: 좌우 분할 / 모바일: 탭 전환 */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 일정 패널 */}
        <aside className={`w-full shrink-0 overflow-y-auto bg-background lg:h-full lg:w-[400px] lg:border-r lg:border-border/50 lg:block ${
          mobileTab === "schedule" ? "flex-1 lg:flex-none" : "hidden lg:block"
        }`}>
          <SchedulePanel
            cityId={cityId}
            activeDayIndex={activeDayIndex}
            onActiveDayIndexChange={setActiveDayIndex}
          />
        </aside>

        {/* 지도 */}
        <main className={`flex-1 lg:block ${
          mobileTab === "map" ? "block" : "hidden lg:block"
        }`}>
          <MapView
            center={cityConfig.center}
            zoom={cityConfig.zoom}
            places={currentDayPlaces}
          />
        </main>
      </div>

      {/* 모바일 하단 탭 바 */}
      <div className="flex border-t border-border/50 glass lg:hidden" data-testid="mobile-tab-bar">
        <button
          onClick={() => setMobileTab("schedule")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
            mobileTab === "schedule"
              ? "text-sakura-dark dark:text-sakura"
              : "text-muted-foreground"
          }`}
        >
          <List className="h-5 w-5" />
          일정
        </button>
        <button
          onClick={() => setMobileTab("map")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
            mobileTab === "map"
              ? "text-sakura-dark dark:text-sakura"
              : "text-muted-foreground"
          }`}
        >
          <MapIcon className="h-5 w-5" />
          지도
        </button>
      </div>
    </div>
  )
}
