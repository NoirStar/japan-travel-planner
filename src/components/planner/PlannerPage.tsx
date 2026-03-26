import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { useSearchParams, useParams } from "react-router-dom"
import { List, MapIcon, MessageSquare, LogIn } from "lucide-react"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityConfig } from "@/data/mapConfig"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { decodeTrip } from "@/lib/shareUtils"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { useMapSearch } from "@/hooks/useMapSearch"
import { useCollaborativeSync } from "@/hooks/useCollaborativeSync"
import { TripChatPanel } from "@/components/planner/TripChatPanel"
import { isChatAvailable } from "@/services/tripChatService"
import type { Place } from "@/types/place"

export function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { shareId } = useParams<{ shareId?: string }>()
  const tripIdParam = searchParams.get("trip")
  const cityIdParam = searchParams.get("city") || "tokyo"
  const forceNew = searchParams.get("new") === "true"

  const { trips, createTrip, setActiveTrip } = useScheduleStore()
  const { user, setShowLoginModal } = useAuthStore()
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const initialized = useRef(false)
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [mobileView, setMobileView] = useState<"schedule" | "map">("map")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [loginToast, setLoginToast] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)

  const showChat = !!trip?.sharedId && isChatAvailable()

  // 공유 링크에서 여행 데이터 복원
  useEffect(() => {
    if (!shareId || initialized.current) return

    const sharedTrip = decodeTrip(shareId)
    if (!sharedTrip) return

    initialized.current = true
    const existing = trips.find((t) => t.id === sharedTrip.id)
    if (existing) {
      setActiveTrip(existing.id)
    } else {
      const newTrip = createTrip(sharedTrip.cityId, sharedTrip.title)
      const store = useScheduleStore.getState()
      store.updateTrip(newTrip.id, {
        startDate: sharedTrip.startDate,
        endDate: sharedTrip.endDate,
      })
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
  }, [shareId, trips, createTrip, setActiveTrip])

  const cityId = trip?.cityId ?? cityIdParam
  const activeDayCityId = trip?.days[activeDayIndex]?.cityId ?? cityId
  const cityConfig = getCityConfig(activeDayCityId)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (forceNew) {
      const newCityConfig = getCityConfig(cityIdParam)
      createTrip(cityIdParam, `${newCityConfig.name} 여행`)
      showToast(`${newCityConfig.name} 여행을 시작합니다`)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete("new")
        return next
      }, { replace: true })
      return
    }

    if (tripIdParam) {
      const target = trips.find((t) => t.id === tripIdParam)
      if (target) {
        setActiveTrip(target.id)
        return
      }
    }

    const existingTrip = trips.find((t) => t.cityId === cityIdParam)
    if (existingTrip) {
      setActiveTrip(existingTrip.id)
    } else {
      const fallbackConfig = getCityConfig(cityIdParam)
      createTrip(cityIdParam, `${fallbackConfig.name} 여행`)
      showToast(`${fallbackConfig.name} 여행을 시작합니다`)
    }
  }, [tripIdParam, cityIdParam, trips, createTrip, setActiveTrip, forceNew, setSearchParams])

  // ── 검색 관련 state/handler ──
  const search = useMapSearch(activeDayCityId)

  // ── 도시 변경 시 검색 결과 초기화 ──
  const lastSeededCity = useRef("")
  useEffect(() => {
    if (!trip) return
    if (lastSeededCity.current === activeDayCityId) return
    if (lastSeededCity.current) search.handleClearMarkers()
    lastSeededCity.current = activeDayCityId
  }, [trip, activeDayCityId, search])

  // ── 공동 편집 동기화 ──
  const collab = useCollaborativeSync(trip)

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
    <div className="flex h-dvh flex-col lg:flex-row" data-testid="planner-page">
      {/* ── 데스크톱: 워크스페이스 패널 (360px) ── */}
      <aside className={`w-full shrink-0 overflow-hidden bg-card lg:h-dvh lg:w-[360px] lg:border-r lg:border-border/30 ${
        mobileView === "schedule" ? "flex-1 lg:flex-none" : "hidden lg:block"
      }`}>
        <SchedulePanel
          cityId={activeDayCityId}
          activeDayIndex={activeDayIndex}
          onActiveDayIndexChange={setActiveDayIndex}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
          collab={collab}
        />
      </aside>

      {/* ── 맵 캔버스 ── */}
      <main className={`relative flex-1 min-h-0 ${
        mobileView === "map" ? "block h-full" : "hidden lg:block"
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

        {/* Chat FAB — 데스크톱 */}
        {showChat && (
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="hidden lg:flex absolute bottom-6 right-6 z-20 h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            {chatUnread > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {chatUnread > 9 ? "9+" : chatUnread}
              </span>
            )}
          </button>
        )}
      </main>

      {/* ── 데스크톱: 채팅 슬라이드인 드로어 ── */}
      {showChat && chatOpen && (
        <aside className="hidden lg:flex w-[320px] shrink-0 border-l border-border/30 bg-card h-dvh">
          <TripChatPanel
            sharedId={trip!.sharedId!}
            mobileOpen={false}
            onMobileClose={() => setChatOpen(false)}
            onUnreadChange={setChatUnread}
          />
        </aside>
      )}

      {/* ── 모바일: 채팅 풀스크린 ── */}
      {showChat && chatOpen && (
        <div className="fixed inset-0 z-50 bg-card lg:hidden">
          <TripChatPanel
            sharedId={trip!.sharedId!}
            mobileOpen
            onMobileClose={() => setChatOpen(false)}
            onUnreadChange={setChatUnread}
          />
        </div>
      )}

      {/* 비로그인 저장 불가 토스트 */}
      {loginToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => { setLoginToast(false); setShowLoginModal(true) }}
            className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm"
          >
            <LogIn className="h-4 w-4" />
            로그인 하면 일정이 자동 저장됩니다
          </button>
        </div>
      )}

      {/* ── 모바일: 뷰 전환 플로팅 버튼 ── */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 lg:hidden">
        {showChat && (
          <button
            onClick={() => setChatOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            {chatUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                {chatUnread > 9 ? "9+" : chatUnread}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setMobileView(mobileView === "schedule" ? "map" : "schedule")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label={mobileView === "schedule" ? "지도 보기" : "일정 보기"}
        >
          {mobileView === "schedule" ? (
            <MapIcon className="h-5 w-5" />
          ) : (
            <List className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}
