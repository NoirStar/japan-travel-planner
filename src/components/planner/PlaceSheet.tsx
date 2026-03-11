import { useState, useMemo, useCallback, useRef } from "react"
import { X, Plus, Star, Search, Check, Globe, Loader2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PlaceCategory, CATEGORY_LABELS } from "@/types/place"
import type { Place } from "@/types/place"
import { useScheduleStore } from "@/stores/scheduleStore"
import { searchGooglePlaces } from "@/services/placesService"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"

interface PlaceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cityId: string
  tripId: string
  dayId: string
}

const CATEGORIES = [
  { value: "all" as const, label: "전체" },
  ...Object.values(PlaceCategory).map((cat) => ({
    value: cat,
    label: CATEGORY_LABELS[cat],
  })),
]

const DISPLAY_LIMIT = 30

export function PlaceSheet({
  open,
  onOpenChange,
  cityId,
  tripId,
  dayId,
}: PlaceSheetProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [googleResults, setGoogleResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addItem } = useScheduleStore()
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const dynamicPlaces = useDynamicPlaceStore((s) => s.places)
  const addOrder = useDynamicPlaceStore((s) => s.addOrder)
  const clearPlaces = useDynamicPlaceStore((s) => s.clearPlaces)

  // 최근 추가순 정렬 + 카테고리/검색 필터
  const loadedPlaces = useMemo(() => {
    // addOrder 역순 (최근 먼저) → 없는 항목은 뒤에
    const ordered = [...addOrder].reverse()
      .map((id) => dynamicPlaces[id])
      .filter(Boolean) as Place[]
    // addOrder에 없는 기존 장소도 포함
    const inOrder = new Set(addOrder)
    const rest = Object.values(dynamicPlaces).filter((p) => !inOrder.has(p.id))
    const all = [...ordered, ...rest]

    let filtered = all
    if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
    }
    return filtered
  }, [dynamicPlaces, addOrder, activeCategory, searchQuery])

  const totalCount = loadedPlaces.length
  const displayPlacesFromCache = showAll ? loadedPlaces : loadedPlaces.slice(0, DISPLAY_LIMIT)
  const hasMoreCached = totalCount > DISPLAY_LIMIT && !showAll

  const addedPlaceIds = useMemo(() => {
    if (!trip) return new Set<string>()
    const ids = new Set<string>()
    for (const day of trip.days) {
      for (const item of day.items) {
        ids.add(item.placeId)
      }
    }
    return ids
  }, [trip])

  const handleAdd = (place: Place) => {
    // Google에서 검색한 장소는 dynamicPlaceStore에 저장
    if (place.id.startsWith("google-")) {
      useDynamicPlaceStore.getState().addPlace(place)
    }
    addItem(tripId, dayId, place.id)
  }

  // Google Places 검색
  const handleGoogleSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      if (!query.trim()) {
        setGoogleResults([])
        return
      }
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true)
        const results = await searchGooglePlaces(query, cityId)
        setGoogleResults(results)
        setIsSearching(false)
      }, 500) // 500ms 디바운스
    },
    [cityId],
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    handleGoogleSearch(value)
  }

  // Google 검색 결과가 있으면 그것을, 없으면 캐시된 장소 표시
  const displayPlaces = googleResults.length > 0 ? googleResults : displayPlacesFromCache
  const isShowingCache = googleResults.length === 0
  const cachedPlaceCount = Object.keys(dynamicPlaces).length

  if (!open) return null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        data-testid="place-sheet-backdrop"
      />

      {/* 시트 패널 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-card shadow-2xl border-t border-border lg:left-0 lg:max-h-full lg:w-[400px] lg:rounded-none lg:rounded-tr-3xl"
        data-testid="place-sheet"
      >
        {/* 핸들 + 헤더 */}
        <div className="flex flex-col items-center border-b border-border px-3 pb-2 pt-2">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-border/80 lg:hidden" />
          <div className="flex w-full items-center justify-between gap-1">
            <h3 className="shrink-0 text-sm font-bold">장소 추가</h3>
            {cachedPlaceCount > 0 && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{cachedPlaceCount}개</span>
            )}
            <div className="ml-auto flex items-center">
              {cachedPlaceCount > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("저장된 장소 캐시를 모두 삭제할까요?")) {
                      clearPlaces()
                      setShowAll(false)
                    }
                  }}
                  className="flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  비우기
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                aria-label="닫기"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="border-b border-border px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="장소 검색 (라멘, 신사, 카페...)"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 rounded-xl border-border pl-9 text-sm"
              data-testid="place-search-input"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-1.5 scrollbar-none" data-testid="category-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                activeCategory === cat.value
                  ? "bg-sakura-dark text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`filter-${cat.value}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 장소 목록 */}
        <div className="flex-1 overflow-y-auto px-3 py-2" data-testid="place-list">
          {displayPlaces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Globe className="h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">
                {isSearching ? "검색 중..." : searchQuery.trim() ? "검색 결과가 없습니다" : "지도에서 장소를 검색하거나 위에서 검색어를 입력하세요"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* 캐시 목록 안내 */}
              {isShowingCache && !searchQuery.trim() && (
                <p className="mb-1 text-[11px] text-muted-foreground">최근 본 장소</p>
              )}
              {displayPlaces.map((place) => {
                const isAdded = addedPlaceIds.has(place.id)
                return (
                  <div
                    key={place.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                      isAdded ? "border-sakura/30 bg-sakura/5" : "border-border hover:border-sakura/30 hover:shadow-sm"
                    }`}
                    data-testid={`place-item-${place.id}`}
                  >
                    {/* 이미지 썸네일 */}
                    {place.image && (
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                        <img src={place.image} alt={place.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight">{place.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{CATEGORY_LABELS[place.category] ?? place.category}</span>
                        {place.rating && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            {place.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={isAdded}
                      onClick={() => handleAdd(place)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isAdded
                          ? "bg-muted text-muted-foreground"
                          : "btn-gradient border-0 text-white shadow-sm active:scale-95"
                      }`}
                      data-testid={`place-add-${place.id}`}
                    >
                      {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )
              })}
              {/* 더 보기 */}
              {isShowingCache && hasMoreCached && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-1 w-full rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-sakura hover:text-foreground"
                >
                  나머지 {totalCount - DISPLAY_LIMIT}개 더 보기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
