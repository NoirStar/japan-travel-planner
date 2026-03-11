import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { useSearchParams, useParams } from "react-router-dom"
import { List, MapIcon, LogIn } from "lucide-react"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityConfig } from "@/data/mapConfig"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { decodeTrip } from "@/lib/shareUtils"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { useMapSearch } from "@/hooks/useMapSearch"
import type { Place } from "@/types/place"

export function PlannerPage() {
  const [searchParams] = useSearchParams()
  const { shareId } = useParams<{ shareId?: string }>()
  const cityIdParam = searchParams.get("city") ?? "tokyo"

  const { trips, createTrip, setActiveTrip } = useScheduleStore()
  const { user, setShowLoginModal } = useAuthStore()
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const initialized = useRef(false)
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [mobileTab, setMobileTab] = useState<"schedule" | "map">("map")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [loginToast, setLoginToast] = useState(false)

  // 공유 링크에서 여행 데이터 복원
  useEffect(() => {
    if (!shareId || initialized.current) return

    const sharedTrip = decodeTrip(shareId)
    if (sharedTrip) {
      initialized.current = true
      const existing = trips.find((t) => t.id === sharedTrip.id)
      if (existing) {
        setActiveTrip(existing.id)
      } else {
        const newTrip = createTrip(sharedTrip.cityId, sharedTrip.title)
        const store = useScheduleStore.getState()
        for (const day of sharedTrip.days) {
          if (day.dayNumber > 1) store.addDay(newTrip.id)
        }
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
    if (initialized.current) return
    initialized.current = true

    const existingTrip = trips.find((t) => t.cityId === cityId)
    if (existingTrip) {
      setActiveTrip(existingTrip.id)
    } else {
      createTrip(cityId, `${cityConfig.name} 여행`)
      showToast(`${cityConfig.name} 여행을 시작합니다`)
    }
  }, [cityId, cityConfig.name, trips, createTrip, setActiveTrip])

  // ── 검색 관련 state/handler ──
  const search = useMapSearch(cityId)

  // 현재 Day의 장소 목록
  const currentDayPlaces: Place[] = useMemo(() => {
    if (!trip) return []
    const day = trip.days[activeDayIndex]
    if (!day) return []
    return day.items
      .map((item) => getAnyPlaceById(item.placeId))
      .filter((p): p is Place => p !== undefined)
  }, [trip, activeDayIndex])

  // 장소 선택 wrapper
  const onSelectPlace = useCallback((placeId: string | null) => {
    search.handleSelectPlace(placeId, setSelectedPlaceId)
  }, [search])

  // 지도에서 장소 추가
  const handleAddPlaceFromMap = useCallback((placeId: string) => {
    if (!trip) return
    const currentDay = trip.days[activeDayIndex]
    if (!currentDay) return
    if (currentDay.items.some((item) => item.placeId === placeId)) return
    useScheduleStore.getState().addItem(trip.id, currentDay.id, placeId)
    if (!user) {
      setLoginToast(true)
      setTimeout(() => setLoginToast(false), 4000)
    }
  }, [trip, activeDayIndex, user])

  // 지도에서 장소 삭제
  const handleRemovePlaceFromMap = useCallback((placeId: string) => {
    if (!trip) return
    const currentDay = trip.days[activeDayIndex]
    if (!currentDay) return
    const item = currentDay.items.find((i) => i.placeId === placeId)
    if (item) {
      useScheduleStore.getState().removeItem(trip.id, currentDay.id, item.id)
    }
  }, [trip, activeDayIndex])

  // POI 클릭 wrapper
  const onPoiClick = useCallback((googlePlaceId: string) => {
    search.handlePoiClick(googlePlaceId, setSelectedPlaceId)
  }, [search])

  return (
    <div className="flex h-dvh flex-col pt-14" data-testid="planner-page">
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row min-h-0">
        {/* 일정 패널 */}
        <aside className={`w-full shrink-0 overflow-y-auto bg-card lg:h-full lg:w-[400px] lg:border-r lg:border-border lg:block ${
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
        <main className={`flex-1 min-h-0 lg:block ${
          mobileTab === "map" ? "block h-full" : "hidden lg:block"
        }`}>
          <MapView
            center={cityConfig.center}
            zoom={cityConfig.zoom}
            places={currentDayPlaces}
            allCityPlaces={search.filteredPlaces}
            activeDayIndex={activeDayIndex}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={onSelectPlace}
            onAddPlace={handleAddPlaceFromMap}
            onRemovePlace={handleRemovePlaceFromMap}
            onPoiClick={onPoiClick}
            onSearchArea={search.handleSearchArea}
            isSearching={search.isSearching}
            searchMessage={search.searchMessage}
            activeCategory={search.activeCategory}
            onCategoryChange={search.handleCategoryChange}
            minRating={search.minRating}
            onMinRatingChange={search.handleMinRatingChange}
            onClearMarkers={search.handleClearMarkers}
            onTextSearch={search.handleTextSearch}
            isTextSearching={search.isTextSearching}
          />
        </main>
      </div>

      {/* 비로그인 저장 불가 토스트 */}
      {loginToast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => { setLoginToast(false); setShowLoginModal(true) }}
            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            <LogIn className="h-4 w-4" />
            로그인 하면 일정이 자동 저장됩니다
          </button>
        </div>
      )}

      {/* 모바일 하단 탭 바 */}
      <div className="flex shrink-0 border-t border-border bg-card lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} data-testid="mobile-tab-bar">
        <button
          onClick={() => setMobileTab("schedule")}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
            mobileTab === "schedule"
              ? "text-sakura-dark dark:text-sakura border-t-2 border-sakura-dark"
              : "text-muted-foreground"
          }`}
        >
          <List className="h-5 w-5" />
          일정
        </button>
        <button
          onClick={() => setMobileTab("map")}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
            mobileTab === "map"
              ? "text-sakura-dark dark:text-sakura border-t-2 border-sakura-dark"
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
