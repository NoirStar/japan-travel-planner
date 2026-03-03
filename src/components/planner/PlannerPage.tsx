import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import { useSearchParams, useParams } from "react-router-dom"
import { List, MapIcon } from "lucide-react"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityConfig } from "@/data/mapConfig"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { decodeTrip } from "@/lib/shareUtils"
import { fetchPlaceDetails } from "@/services/placesService"
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

    const sharedTrip = decodeTrip(shareId)
    if (sharedTrip) {
      initialized.current = true
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
    if (initialized.current) return
    initialized.current = true

    const existingTrip = trips.find((t) => t.cityId === cityId)
    if (existingTrip) {
      setActiveTrip(existingTrip.id)
    } else {
      createTrip(cityId, `${cityConfig.name} 여행`)
    }
  }, [cityId, cityConfig.name, trips, createTrip, setActiveTrip])

  // 도시의 전체 장소 목록 (검색 후에만 로드)
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([])
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [minRating, setMinRating] = useState<number | undefined>(undefined)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("popularity")
  // 마지막 검색 좌표 (카테고리 변경 시 자동 재검색용)
  const lastSearchRef = useRef<{ lat: number; lng: number; radius: number } | null>(null)
  // API에서 카테고리 검색이 적용되었는지 추적 (이중 필터링 방지)
  const lastSearchCategory = useRef<string | undefined>(undefined)

  // Google 장소 목록 (별점 필터 + 정렬 적용 — 클라이언트 사이드)
  // 카테고리 필터는 API에서 이미 적용되었으므로 클라이언트에서 중복 필터링하지 않음
  const allCityPlaces = useMemo(() => {
    let filtered = googlePlaces
    if (minRating) {
      filtered = filtered.filter((p) => (p.rating ?? 0) >= minRating)
    }
    // 정렬 적용
    const sorted = [...filtered]
    switch (sortBy) {
      case "rating-desc":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
      case "rating-asc":
        sorted.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
        break
      case "reviews-desc":
        sorted.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0))
        break
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"))
        break
      // "popularity" — Google API 기본 반환 순서 유지
      default:
        break
    }
    return sorted
  }, [googlePlaces, minRating, sortBy])

  // 현재 Day의 장소 목록을 Place 객체로 변환
  const currentDayPlaces: Place[] = useMemo(() => {
    if (!trip) return []
    const day = trip.days[activeDayIndex]
    if (!day) return []
    return day.items
      .map((item) => getAnyPlaceById(item.placeId))
      .filter((p): p is Place => p !== undefined)
  }, [trip, activeDayIndex])

  // 장소 선택 시 상세 정보 (리뷰 등) lazy-load
  const handleSelectPlace = useCallback(async (placeId: string | null) => {
    setSelectedPlaceId(placeId)
    if (!placeId) return

    // 이미 리뷰가 로드된 장소인지 확인
    const existing = googlePlaces.find((p) => p.id === placeId)
    if (existing?.reviews && existing.reviews.length > 0) return

    // googlePlaceId로 상세 정보 fetch
    const gid = existing?.googlePlaceId
    if (!gid) return

    const detailed = await fetchPlaceDetails(gid, cityId)
    if (detailed) {
      useDynamicPlaceStore.getState().addPlace(detailed)
      setGooglePlaces((prev) =>
        prev.map((p) => (p.id === placeId ? { ...p, ...detailed } : p)),
      )
    }
  }, [googlePlaces, cityId])

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

  // Google Maps 기본 POI 클릭 처리
  const handlePoiClick = async (googlePlaceId: string) => {
    // 이미 로드된 장소인지 확인
    const existing = allCityPlaces.find((p) => p.googlePlaceId === googlePlaceId || p.id === `google-${googlePlaceId}`)
    if (existing) {
      setSelectedPlaceId(existing.id)
      return
    }

    // 새 장소 정보 가져오기
    const place = await fetchPlaceDetails(googlePlaceId, cityId)
    if (place) {
      useDynamicPlaceStore.getState().addPlace(place)
      setGooglePlaces((prev) => [...prev, place])
      setSelectedPlaceId(place.id)
    }
  }

  // 현재 지도 영역에서 장소 검색 (이전 결과 교체)
  const handleSearchArea = useCallback(async (lat: number, lng: number, radius: number, categoryOverride?: string | null) => {
    // categoryOverride: null = 전체, undefined = 현재 activeCategory 사용
    const searchCategory = categoryOverride === null ? undefined : (categoryOverride ?? activeCategory)
    setIsSearching(true)
    setSearchMessage(null)
    // 마지막 검색 좌표 및 카테고리 저장
    lastSearchRef.current = { lat, lng, radius }
    lastSearchCategory.current = searchCategory
    try {
      const res = await fetch("/api/places-nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId, lat, lng, category: searchCategory, minRating, radius }),
      })
      if (!res.ok) {
        console.error("Search API error:", res.status)
        setSearchMessage("검색에 실패했습니다. 다시 시도해주세요.")
        return
      }
      const data = await res.json()
      const places: Place[] = (data.places ?? []).map((p: Place) => ({
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        category: p.category,
        cityId,
        location: p.location,
        rating: p.rating,
        ratingCount: p.ratingCount,
        image: p.image,
        description: p.description ?? p.address,
        address: p.address,
        googlePlaceId: p.googlePlaceId,
      }))
      
      if (places.length > 0) {
        const store = useDynamicPlaceStore.getState()
        for (const p of places) {
          store.addPlace(p)
        }
        setGooglePlaces(places)
        setSearchMessage(`${places.length}개 장소를 찾았습니다`)
      } else {
        setGooglePlaces([])
        setSearchMessage("이 지역에서 장소를 찾지 못했습니다. 지도를 이동해보세요.")
      }
    } catch (error) {
      console.error("Search area error:", error)
      setSearchMessage("네트워크 오류가 발생했습니다.")
    } finally {
      setIsSearching(false)
      // 메시지 자동 숨김
      setTimeout(() => setSearchMessage(null), 4000)
    }
  }, [cityId, activeCategory, minRating])

  // 카테고리 변경 핸들러 — 이전 검색 좌표로 자동 재검색
  const handleCategoryChange = useCallback((category: string | undefined) => {
    setActiveCategory(category)
    // 이전에 검색한 적 있으면 새 카테고리로 재검색
    if (lastSearchRef.current) {
      const { lat, lng, radius } = lastSearchRef.current
      handleSearchArea(lat, lng, radius, category ?? null)
    }
  }, [handleSearchArea])

  // 최소 별점 변경 핸들러
  const handleMinRatingChange = useCallback((rating: number | undefined) => {
    setMinRating(rating)
  }, [])

  // 마커 초기화 핸들러
  const handleClearMarkers = useCallback(() => {
    setGooglePlaces([])
    setActiveCategory(undefined)
    setMinRating(undefined)
  }, [])

  return (
    <div className="flex h-screen flex-col pt-14" data-testid="planner-page">
      {/* 데스크톱: 좌우 분할 / 모바일: 탭 전환 */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
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
        <main className={`flex-1 lg:block ${
          mobileTab === "map" ? "block" : "hidden lg:block"
        }`}>
          <MapView
            center={cityConfig.center}
            zoom={cityConfig.zoom}
            places={currentDayPlaces}
            allCityPlaces={allCityPlaces}
            activeDayIndex={activeDayIndex}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlace}
            onAddPlace={handleAddPlaceFromMap}
            onPoiClick={handlePoiClick}
            onSearchArea={handleSearchArea}
            isSearching={isSearching}
            searchMessage={searchMessage}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            minRating={minRating}
            onMinRatingChange={handleMinRatingChange}
            onClearMarkers={handleClearMarkers}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </main>
      </div>

      {/* 모바일 하단 탭 바 */}
      <div className="flex border-t border-border bg-card lg:hidden" data-testid="mobile-tab-bar">
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
