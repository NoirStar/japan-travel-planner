import { useState, useMemo } from "react"
import { X, Bookmark, Plus, Trash2, Star, Check } from "lucide-react"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { CATEGORY_LABELS } from "@/types/place"

interface WishlistPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  dayId: string
}

export function WishlistPanel({ open, onOpenChange, tripId, dayId }: WishlistPanelProps) {
  const trip = useScheduleStore((s) => s.trips.find((t) => t.id === tripId))
  const items = trip?.wishlist ?? []
  const removeFromWishlist = useScheduleStore((s) => s.removeFromWishlist)
  const { addItem } = useScheduleStore()

  // 이미 일정에 있는 장소 ID 세트
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

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const handleAddToSchedule = (placeId: string) => {
    addItem(tripId, dayId, placeId)
    removeFromWishlist(tripId, placeId)
    setRemovedIds((prev) => new Set(prev).add(placeId))
  }

  if (!open) return null

  const visibleItems = items.filter((i) => !removedIds.has(i.placeId))

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        data-testid="wishlist-backdrop"
      />

      {/* 시트 패널 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-3xl bg-card shadow-2xl border-t border-border lg:left-0 lg:max-h-full lg:w-[400px] lg:rounded-none lg:rounded-tr-3xl"
        data-testid="wishlist-panel"
      >
        {/* 핸들 + 헤더 */}
        <div className="flex flex-col items-center border-b border-border px-3 pb-2 pt-2">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-border/80 lg:hidden" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 fill-rose-500 text-rose-500" />
              <h3 className="text-sm font-bold">북마크</h3>
              {visibleItems.length > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                  {visibleItems.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="닫기"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 장소 목록 */}
        <div className="flex-1 overflow-y-auto px-3 py-2" data-testid="wishlist-items">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10">
                <Bookmark className="h-6 w-6 text-rose-500/40" />
              </div>
              <div>
                <p className="text-sm font-semibold">북마크가 비어있습니다</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  장소 검색에서 <Bookmark className="inline h-3 w-3 text-rose-400" /> 버튼을 눌러<br />
                  관심 있는 장소를 저장하세요
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-muted-foreground">
                장소를 일정에 추가하거나 나중에 참고하세요
              </p>
              {visibleItems.map((item) => {
                const place = getAnyPlaceById(item.placeId)
                if (!place) return null
                const isAdded = addedPlaceIds.has(item.placeId)

                return (
                  <div
                    key={item.placeId}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                      isAdded ? "border-sakura/30 bg-sakura/5" : "border-border hover:border-rose-300 hover:shadow-sm"
                    }`}
                    data-testid={`wishlist-item-${item.placeId}`}
                  >
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
                    <div className="flex gap-1">
                      {isAdded ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToSchedule(item.placeId)}
                          className="btn-gradient flex h-7 w-7 items-center justify-center rounded-full border-0 text-white shadow-sm active:scale-95"
                          title="일정에 추가"
                          data-testid={`wishlist-to-schedule-${item.placeId}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => removeFromWishlist(tripId, item.placeId)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="후보함에서 삭제"
                        data-testid={`wishlist-remove-${item.placeId}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
