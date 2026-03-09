/**
 * useMapSearch — PlannerPage에서 지도 검색 관련 state와 핸들러를 분리한 커스텀 훅
 */
import { useState, useRef, useMemo, useCallback } from "react"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { fetchPlaceDetails, searchGooglePlaces } from "@/services/placesService"
import type { Place } from "@/types/place"

export function useMapSearch(cityId: string) {
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([])
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [minRating, setMinRating] = useState<number | undefined>(undefined)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("popularity")
  const [isTextSearching, setIsTextSearching] = useState(false)

  // 마지막 검색 좌표 (카테고리 변경 시 자동 재검색용)
  const lastSearchRef = useRef<{ lat: number; lng: number; radius: number } | null>(null)
  // API에서 카테고리 검색이 적용되었는지 추적 (이중 필터링 방지)
  const lastSearchCategory = useRef<string | undefined>(undefined)

  // Google 장소 목록 (별점 필터 + 정렬 적용 — 클라이언트 사이드)
  const filteredPlaces = useMemo(() => {
    let filtered = googlePlaces
    if (minRating) {
      filtered = filtered.filter((p) => (p.rating ?? 0) >= minRating)
    }
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
      default:
        break
    }
    return sorted
  }, [googlePlaces, minRating, sortBy])

  // 장소 선택 시 상세 정보 lazy-load
  const handleSelectPlace = useCallback(async (placeId: string | null, setSelectedPlaceId: (id: string | null) => void) => {
    setSelectedPlaceId(placeId)
    if (!placeId) return

    const existing = googlePlaces.find((p) => p.id === placeId)
    if (existing?.image && existing?.googleMapsUri) return

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

  // Google Maps POI 클릭 처리
  const handlePoiClick = useCallback(async (googlePlaceId: string, setSelectedPlaceId: (id: string | null) => void) => {
    const existing = filteredPlaces.find((p) => p.googlePlaceId === googlePlaceId || p.id === `google-${googlePlaceId}`)
    if (existing) {
      setSelectedPlaceId(existing.id)
      return
    }
    const place = await fetchPlaceDetails(googlePlaceId, cityId)
    if (place) {
      useDynamicPlaceStore.getState().addPlace(place)
      setGooglePlaces((prev) => [...prev, place])
      setSelectedPlaceId(place.id)
    }
  }, [filteredPlaces, cityId])

  // 현재 지도 영역에서 장소 검색
  const handleSearchArea = useCallback(async (lat: number, lng: number, radius: number, categoryOverride?: string | null) => {
    const searchCategory = categoryOverride === null ? undefined : (categoryOverride ?? activeCategory)
    setIsSearching(true)
    setSearchMessage(null)
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
        for (const p of places) store.addPlace(p)
        setGooglePlaces(places)
        const visibleCount = minRating
          ? places.filter((p) => (p.rating ?? 0) >= minRating).length
          : places.length
        if (minRating && visibleCount < places.length) {
          setSearchMessage(`${places.length}개 중 ${visibleCount}개 표시 (${minRating}점 이상)`)
        } else {
          setSearchMessage(`${places.length}개 장소를 찾았습니다`)
        }
      } else {
        setGooglePlaces([])
        setSearchMessage("이 지역에서 장소를 찾지 못했습니다. 지도를 이동해보세요.")
      }
    } catch (error) {
      console.error("Search area error:", error)
      setSearchMessage("네트워크 오류가 발생했습니다.")
    } finally {
      setIsSearching(false)
      setTimeout(() => setSearchMessage(null), 4000)
    }
  }, [cityId, activeCategory, minRating])

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((category: string | undefined, lat: number, lng: number, radius: number) => {
    setActiveCategory(category)
    handleSearchArea(lat, lng, radius, category ?? null)
  }, [handleSearchArea])

  // 최소 별점 변경 핸들러
  const handleMinRatingChange = useCallback((rating: number | undefined) => {
    setMinRating(rating)
  }, [])

  // 마커 초기화
  const handleClearMarkers = useCallback(() => {
    setGooglePlaces([])
    setActiveCategory(undefined)
    setMinRating(undefined)
  }, [])

  // 텍스트 검색
  const handleTextSearch = useCallback(async (query: string) => {
    setIsTextSearching(true)
    setSearchMessage(null)
    try {
      const results = await searchGooglePlaces(query, cityId)
      if (results.length > 0) {
        const store = useDynamicPlaceStore.getState()
        for (const p of results) store.addPlace(p)
        setGooglePlaces(results)
        setSearchMessage(`"${query}" ${results.length}개 결과`)
      } else {
        setSearchMessage(`"${query}" 검색 결과가 없습니다`)
      }
    } catch {
      setSearchMessage("검색 중 오류가 발생했습니다")
    } finally {
      setIsTextSearching(false)
      setTimeout(() => setSearchMessage(null), 4000)
    }
  }, [cityId])

  return {
    // state
    filteredPlaces,
    activeCategory,
    minRating,
    isSearching,
    searchMessage,
    sortBy,
    setSortBy,
    isTextSearching,
    // handlers
    handleSelectPlace,
    handlePoiClick,
    handleSearchArea,
    handleCategoryChange,
    handleMinRatingChange,
    handleClearMarkers,
    handleTextSearch,
  }
}
