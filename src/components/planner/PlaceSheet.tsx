import { useState, useMemo } from "react"
import { X, Plus, Star, Search, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPlacesByCity } from "@/data/places"
import { PlaceCategory, CATEGORY_LABELS } from "@/types/place"
import type { Place } from "@/types/place"
import { useScheduleStore } from "@/stores/scheduleStore"

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

export function PlaceSheet({
  open,
  onOpenChange,
  cityId,
  tripId,
  dayId,
}: PlaceSheetProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { addItem } = useScheduleStore()
  const trip = useScheduleStore((s) => s.getActiveTrip())

  const allCityPlaces = useMemo(() => getPlacesByCity(cityId), [cityId])

  // 이미 일정에 추가된 장소 ID 수집
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

  const filteredPlaces = useMemo(() => {
    let places = allCityPlaces
    if (activeCategory !== "all") {
      places = places.filter((p) => p.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
    }
    return places
  }, [allCityPlaces, activeCategory, searchQuery])

  const handleAdd = (place: Place) => {
    addItem(tripId, dayId, place.id)
  }

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
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-3xl bg-background shadow-2xl ring-1 ring-border/30 lg:left-0 lg:max-h-full lg:w-[400px] lg:rounded-none lg:rounded-tr-3xl"
        data-testid="place-sheet"
      >
        {/* 핸들 + 헤더 */}
        <div className="flex flex-col items-center border-b border-border/50 px-4 pb-3 pt-2">
          <div className="mb-2 h-1 w-10 rounded-full bg-border/80 lg:hidden" />
          <div className="flex w-full items-center justify-between">
            <h3 className="text-sm font-bold">장소 추가</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="닫기"
              className="h-7 w-7 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 검색 */}
        <div className="border-b border-border/50 px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="장소 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl border-border/50 pl-9 text-sm"
              data-testid="place-search-input"
            />
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-border/50 px-4 py-2" data-testid="category-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                activeCategory === cat.value
                  ? "bg-gradient-to-r from-sakura-dark to-indigo text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`filter-${cat.value}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 장소 목록 */}
        <div className="flex-1 overflow-y-auto p-4" data-testid="place-list">
          {filteredPlaces.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredPlaces.map((place) => {
                const isAdded = addedPlaceIds.has(place.id)
                return (
                  <div
                    key={place.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                      isAdded ? "border-sakura/30 bg-sakura/5" : "border-border/50 hover:border-sakura/20 hover:shadow-sm"
                    }`}
                    data-testid={`place-item-${place.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{place.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{CATEGORY_LABELS[place.category]}</span>
                        {place.rating && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {place.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={isAdded ? "secondary" : "default"}
                      size="sm"
                      disabled={isAdded}
                      onClick={() => handleAdd(place)}
                      className={`shrink-0 gap-1 rounded-full text-xs ${
                        isAdded ? "" : "btn-gradient border-0 shadow-sm"
                      }`}
                      data-testid={`place-add-${place.id}`}
                    >
                      {isAdded ? (
                        <><Check className="h-3 w-3" /> 추가됨</>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          추가
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
