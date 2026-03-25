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
  const [mobileTab, setMobileTab] = useState<"schedule" | "map" | "chat">("schedule")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [loginToast, setLoginToast] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)

  const showChatTab = !!trip?.sharedId && isChatAvailable()

  // 공유 링크에서 여행 데이터 복원
  useEffect(() => {
    if (!shareId || initialized.current) return

    const sharedTrip = decodeTrip(shareId)
    if (!sharedTrip) return // 유효하지 않은 공유 ID → 기본 여행 생성 효과로 위임

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
      // ?new=true 파라미터 제거 (뒤로 가기 시 재생성 방지)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete("new")
        return next
      }, { replace: true })
      return
    }

    // tripId가 명시된 경우 → 해당 trip을 활성화
    if (tripIdParam) {
      const target = trips.find((t) => t.id === tripIdParam)
      if (target) {
        setActiveTrip(target.id)
        return
      }
      // tripId가 유효하지 않으면 cityId 폴백
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
    // 도시가 바뀌면 이전 검색 결과 정리
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
    <div className="flex h-dvh flex-col pt-16" data-testid="planner-page">
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row min-h-0">
        {/* 일정 패널 */}
        <aside className={`w-full shrink-0 overflow-hidden bg-card/50 backdrop-blur-sm lg:h-full lg:w-[400px] lg:border-r lg:border-border/30 lg:block ${
          mobileTab === "schedule" ? "flex-1 lg:flex-none" : "hidden lg:block"
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

        {/* 채팅 — 인라인 탭 콘텐츠 (모바일) */}
        {trip?.sharedId && isChatAvailable() && (
          <div className={`w-full lg:hidden ${mobileTab === "chat" ? "flex flex-1 min-h-0" : "hidden"}`}>
            <TripChatPanel
              sharedId={trip.sharedId}
              mobileOpen={mobileTab === "chat"}
              onMobileClose={() => setMobileTab("schedule")}
              onUnreadChange={setChatUnread}
            />
          </div>
        )}
      </div>

      {/* 데스크톱 floating 채팅 */}
      {trip?.sharedId && isChatAvailable() && (
        <TripChatPanel
          sharedId={trip.sharedId}
          mobileOpen={false}
          onUnreadChange={setChatUnread}
          desktopOnly
        />
      )}

      {/* 비로그인 저장 불가 토스트 */}
      {loginToast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => { setLoginToast(false); setShowLoginModal(true) }}
            className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm font-medium text-foreground shadow-lg"
          >
            <LogIn className="h-4 w-4" />
            로그인 하면 일정이 자동 저장됩니다
          </button>
        </div>
      )}

      {/* 모바일 하단 탭 바 */}
      <div className="flex shrink-0 border-t border-border/30 bg-card/80 backdrop-blur-xl shadow-[0_-2px_20px_rgba(0,0,0,0.15)] lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} data-testid="mobile-tab-bar">
        <button
          onClick={() => setMobileTab("schedule")}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-caption font-semibold transition-colors ${
            mobileTab === "schedule"
              ? "text-cyan border-t-2 border-cyan"
              : "text-muted-foreground"
          }`}
        >
          <List className="h-5 w-5" />
          일정
        </button>
        <button
          onClick={() => setMobileTab("map")}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-caption font-semibold transition-colors ${
            mobileTab === "map"
              ? "text-cyan border-t-2 border-cyan"
              : "text-muted-foreground"
          }`}
        >
          <MapIcon className="h-5 w-5" />
          <span>지도 <span className="text-[10px] font-bold opacity-70">Day {activeDayIndex + 1}</span></span>
        </button>
        {showChatTab && (
          <button
            onClick={() => setMobileTab("chat")}
            className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-caption font-semibold transition-colors ${
              mobileTab === "chat"
                ? "text-cyan border-t-2 border-cyan"
                : "text-muted-foreground"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            채팅
            {chatUnread > 0 && mobileTab !== "chat" && (
              <span className="absolute right-1/4 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {chatUnread > 99 ? "99+" : chatUnread}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
