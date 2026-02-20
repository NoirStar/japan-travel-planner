import { useEffect, useRef, useMemo, useState } from "react"
import { useSearchParams, useParams } from "react-router-dom"
import { List, MapIcon } from "lucide-react"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityConfig } from "@/data/mapConfig"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getPlacesByCity } from "@/data/places"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { decodeTrip } from "@/lib/shareUtils"
import { fetchNearbyPlaces } from "@/services/placesService"
import type { Place } from "@/types/place"

export function PlannerPage() {
  const [searchParams] = useSearchParams()
  const { shareId } = useParams<{ shareId?: string }>()
  const cityIdParam = searchParams.get("city") ?? "tokyo"

  const { trips, createTrip, setActiveTrip } = useScheduleStore()
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const initialized = useRef(false)
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [mobileTab, setMobileTab] = useState<"schedule" | "map">("schedule")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  // 공유 링크에서 여행 데이터 복원
  useEffect(() => {
    if (!shareId || initialized.current) return
    initialized.current = true

    const sharedTrip = decodeTrip(shareId)
    if (sharedTrip) {
      // 동일 공유 트립이 이미 있는지 확인
      const existing = trips.find((t) => t.id === sharedTrip.id)
      if (existing) {
        setActiveTrip(existing.id)
      } else {
        // 새 트립으로 생성
        const newTrip = createTrip(sharedTrip.cityId, sharedTrip.title)
        // 공유 데이터의 days 복원 - Store를 통해 아이템 추가
        const store = useScheduleStore.getState()
        // Remove existing empty day and rebuild
        for (const day of sharedTrip.days) {
          if (day.dayNumber > 1) store.addDay(newTrip.id)
        }
        // 아이템 추가
        const updatedTrip = store.trips.find((t) => t.id === newTrip.id)
        if (updatedTrip) {
          for (let di = 0; di < sharedTrip.days.length; di++) {
            const sharedDay = sharedTrip.days[di]
            const targetDay = updatedTrip.days[di]
            if (!targetDay) continue
            for (const item of sharedDay.items) {
              const newItem = store.addItem(newTrip.id, targetDay.id, item.placeId)
              if (item.startTime || item.memo) {
                store.updateItem(newTrip.id, targetDay.id, newItem.id, {
                  startTime: item.startTime,
                  memo: item.memo,
                })
              }
            }
          }
        }
      }
      return
    }
  }, [shareId, trips, createTrip, setActiveTrip])

  const cityId = trip?.cityId ?? cityIdParam
  const cityConfig = getCityConfig(cityId)

  useEffect(() => {
    if (initialized.current || shareId) return
    initialized.current = true

    const existingTrip = trips.find((t) => t.cityId === cityId)
    if (existingTrip) {
      setActiveTrip(existingTrip.id)
    } else {
      createTrip(cityId, `${cityConfig.name} 여행`)
    }
  }, [cityId, cityConfig.name, trips, createTrip, setActiveTrip, shareId])

  // 도시의 전체 장소 목록 (큐레이션 + Google Nearby)
  const curatedPlaces = useMemo(() => getPlacesByCity(cityId), [cityId])
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([])
  const nearbyLoaded = useRef<string>("")

  // 도시 진입 시 Google Places Nearby 데이터 자동 로드
  useEffect(() => {
    if (nearbyLoaded.current === cityId) return
    nearbyLoaded.current = cityId

    fetchNearbyPlaces(cityId).then((places) => {
      if (places.length > 0) {
        setGooglePlaces(places)
        // dynamicPlaceStore에 저장 (일정 추가 시 조회 가능하도록)
        const store = useDynamicPlaceStore.getState()
        for (const p of places) {
          store.addPlace(p)
        }
      }
    }).catch(() => {
      // Google API 실패 시 큐레이션만 사용
    })
  }, [cityId])

  // 큐레이션 + Google 장소 통합 (중복 제거)
  const allCityPlaces = useMemo(() => {
    const curatedIds = new Set(curatedPlaces.map((p) => p.id))
    const uniqueGoogle = googlePlaces.filter((p) => !curatedIds.has(p.id))
    return [...curatedPlaces, ...uniqueGoogle]
  }, [curatedPlaces, googlePlaces])

  // 현재 Day의 장소 목록을 Place 객체로 변환
  const currentDayPlaces: Place[] = useMemo(() => {
    if (!trip) return []
    const day = trip.days[activeDayIndex]
    if (!day) return []
    return day.items
      .map((item) => getAnyPlaceById(item.placeId))
      .filter((p): p is Place => p !== undefined)
  }, [trip, activeDayIndex])

  // 지도에서 장소를 클릭하여 일정에 추가
  const handleAddPlaceFromMap = (placeId: string) => {
    if (!trip) return
    const currentDay = trip.days[activeDayIndex]
    if (!currentDay) return
    // 이미 추가된 장소인지 확인
    const alreadyAdded = currentDay.items.some((item) => item.placeId === placeId)
    if (alreadyAdded) return
    useScheduleStore.getState().addItem(trip.id, currentDay.id, placeId)
  }

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
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
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
            allCityPlaces={allCityPlaces}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
            onAddPlace={handleAddPlaceFromMap}
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
