import { useState, useEffect, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { MapPin, Bot, Plus, Train, BarChart3, Footprints, TrainFront, Calendar, Share2, Check, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { getCityConfig } from "@/data/mapConfig"
import { estimateTravel, formatTravelTime, formatDistance } from "@/lib/utils"
import type { TransportMode } from "@/lib/utils"
import { DayTabs } from "./DayTabs"
import { PlaceCard } from "./PlaceCard"
import { SortablePlaceCard } from "./SortablePlaceCard"
import { PlaceSheet } from "./PlaceSheet"
import { copyShareUrl } from "@/lib/shareUtils"

interface SchedulePanelProps {
  cityId: string
  activeDayIndex: number
  onActiveDayIndexChange: (index: number) => void
  selectedPlaceId?: string | null
  onSelectPlace?: (placeId: string | null) => void
}

export function SchedulePanel({ cityId, activeDayIndex, onActiveDayIndexChange, selectedPlaceId, onSelectPlace }: SchedulePanelProps) {
  const cityConfig = getCityConfig(cityId)
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const { addDay, removeDay, removeItem, moveItem, updateItem, updateTrip, clearDay } = useScheduleStore()

  /** 날짜 변경 시 Day 수 자동 조정 */
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    if (!trip) return
    updateTrip(trip.id, { [field]: value })

    // 양쪽 날짜가 모두 설정된 경우 Day 수 조정
    const start = field === "startDate" ? value : trip.startDate
    const end = field === "endDate" ? value : trip.endDate
    if (!start || !end) return

    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (diffDays < 1 || diffDays > 30) return // 비정상 범위 무시

    const currentDays = trip.days.length
    if (diffDays > currentDays) {
      // Day 추가
      for (let i = currentDays; i < diffDays; i++) {
        addDay(trip.id)
      }
    } else if (diffDays < currentDays) {
      // 뒤쪽 Day부터 삭제 (일정이 있는 Day는 경고 없이 삭제)
      const latestTrip = useScheduleStore.getState().trips.find((t) => t.id === trip.id)
      if (latestTrip) {
        for (let i = latestTrip.days.length - 1; i >= diffDays; i--) {
          removeDay(trip.id, latestTrip.days[i].id)
        }
      }
      if (activeDayIndex >= diffDays) {
        onActiveDayIndexChange(diffDays - 1)
      }
    }
  }

  const [isPlaceSheetOpen, setIsPlaceSheetOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 마커 클릭 시 해당 카드로 자동 스크롤
  useEffect(() => {
    if (!selectedPlaceId || !scrollContainerRef.current) return
    const card = scrollContainerRef.current.querySelector(`[data-place-id="${selectedPlaceId}"]`)
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [selectedPlaceId])

  // ── DnD 센서 ──────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground" data-testid="schedule-panel">
        <p className="text-sm">여행을 불러오는 중...</p>
      </div>
    )
  }

  const currentDay = trip.days[activeDayIndex]
  const items = currentDay?.items ?? []

  // sortable 아이디 배열
  const itemIds = items.map((item) => item.id)

  // 드래그 오버레이에 표시할 장소 정보
  const activeItem = activeItemId
    ? items.find((i) => i.id === activeItemId)
    : null
  const activePlace = activeItem ? getAnyPlaceById(activeItem.placeId) : null
  const activeIndex = activeItem
    ? items.findIndex((i) => i.id === activeItemId)
    : -1

  const handleAddDay = () => {
    addDay(trip.id)
  }

  const handleRemoveDay = (dayId: string) => {
    if (trip.days.length <= 1) return
    removeDay(trip.id, dayId)
    if (activeDayIndex >= trip.days.length - 1) {
      onActiveDayIndexChange(Math.max(0, trip.days.length - 2))
    }
  }

  const handleRemoveItem = (itemId: string) => {
    if (!currentDay) return
    removeItem(trip.id, currentDay.id, itemId)
  }

  // ── DnD 이벤트 핸들러 ─────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveItemId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItemId(null)
    const { active, over } = event
    if (!over || !currentDay) return
    if (active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    moveItem(trip.id, currentDay.id, currentDay.id, active.id as string, newIndex)
  }

  const handleDragCancel = () => {
    setActiveItemId(null)
  }

  return (
    <div className="flex h-full flex-col" data-testid="schedule-panel">
      {/* 헤더 */}
      <div className="border-b border-border p-4">
        <h2 className="text-base font-bold">
          {cityConfig.name} 여행
        </h2>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2.5 dark:bg-muted">
          <Calendar className="h-4 w-4 shrink-0 text-sakura-dark" />
          <input
            type="date"
            value={trip.startDate ?? ""}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="h-8 w-full min-w-0 rounded-lg bg-card px-2.5 text-xs font-medium text-foreground outline-none border border-border shadow-sm focus:border-sakura-dark focus:ring-2 focus:ring-sakura/30"
            data-testid="trip-start-date"
          />
          <span className="shrink-0 text-xs font-bold text-muted-foreground">~</span>
          <input
            type="date"
            value={trip.endDate ?? ""}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="h-8 w-full min-w-0 rounded-lg bg-card px-2.5 text-xs font-medium text-foreground outline-none border border-border shadow-sm focus:border-sakura-dark focus:ring-2 focus:ring-sakura/30"
            data-testid="trip-end-date"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-end">
          <span className="flex items-center gap-1 text-[10px] text-emerald-500" data-testid="auto-save-indicator">
            <Save className="h-3 w-3" />
            자동 저장
          </span>
        </div>
      </div>

      {/* Day 탭 */}
      <DayTabs
        days={trip.days}
        activeDayIndex={activeDayIndex}
        onSelectDay={onActiveDayIndexChange}
        onAddDay={handleAddDay}
        onRemoveDay={handleRemoveDay}
        tripStartDate={trip.startDate}
      />

      {/* 일정 카드 리스트 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4" data-testid="schedule-items">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <MapPin className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">아직 추가된 장소가 없습니다</p>
            <p className="text-xs text-muted-foreground/60">아래 버튼으로 장소를 추가해보세요</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {items.map((item, index) => {
                  const place = getAnyPlaceById(item.placeId)
                  if (!place) return null

                  // 이전 장소와의 이동시간 커넥터
                  const prevItem = index > 0 ? items[index - 1] : null
                  const prevPlace = prevItem ? getAnyPlaceById(prevItem.placeId) : null
                  let travelMinutes = 0
                  let travelMode: TransportMode = "metro"
                  let distanceKm = 0
                  if (prevPlace && place) {
                    const est = estimateTravel(
                      prevPlace.location.lat, prevPlace.location.lng,
                      place.location.lat, place.location.lng,
                    )
                    travelMinutes = est.minutes
                    travelMode = est.mode
                    distanceKm = est.distanceKm
                  }

                  return (
                    <div key={item.id}>
                      {/* 이동시간 커넥터 */}
                      {prevPlace && (
                        <div className="flex items-center gap-2 py-1.5 pl-3" data-testid={`travel-connector-${index}`}>
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-px bg-border" />
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/80">
                              {travelMode === "walk" ? (
                                <Footprints className="h-3 w-3 text-muted-foreground" />
                              ) : travelMode === "metro" ? (
                                <Train className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <TrainFront className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="h-3 w-px bg-border" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {formatTravelTime(travelMinutes, travelMode)} · {formatDistance(distanceKm)}
                          </span>
                        </div>
                      )}
                      <SortablePlaceCard
                        id={item.id}
                        place={place}
                        index={index}
                        onRemove={() => handleRemoveItem(item.id)}
                        startTime={item.startTime}
                        memo={item.memo}
                        onStartTimeChange={(time) => {
                          if (trip && currentDay) updateItem(trip.id, currentDay.id, item.id, { startTime: time })
                        }}
                        onMemoChange={(memoValue) => {
                          if (trip && currentDay) updateItem(trip.id, currentDay.id, item.id, { memo: memoValue })
                        }}
                        isSelected={selectedPlaceId === item.placeId}
                        onClick={() => onSelectPlace?.(item.placeId === selectedPlaceId ? null : item.placeId)}
                      />
                    </div>
                  )
                })}
              </div>
            </SortableContext>

            {/* 드래그 오버레이 */}
            <DragOverlay dropAnimation={null}>
              {activePlace && activeIndex >= 0 ? (
                <div className="opacity-90" data-testid="drag-overlay">
                  <PlaceCard
                    place={activePlace}
                    index={activeIndex}
                    onRemove={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Day 요약 */}
      {items.length > 0 && (() => {
        // 총 이동시간 계산
        let totalTravelMinutes = 0
        for (let i = 1; i < items.length; i++) {
          const prev = getAnyPlaceById(items[i - 1].placeId)
          const curr = getAnyPlaceById(items[i].placeId)
          if (prev && curr) {
            totalTravelMinutes += estimateTravel(
              prev.location.lat, prev.location.lng,
              curr.location.lat, curr.location.lng,
            ).minutes
          }
        }
        return (
          <div className="border-t border-border bg-muted px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between" data-testid="day-summary">
            <div>
              <span className="mr-1 inline-flex items-center"><BarChart3 className="mr-1 inline h-3.5 w-3.5" /></span>Day {currentDay?.dayNumber} 요약 — <span className="font-semibold text-foreground">장소 {items.length}개</span>
              {totalTravelMinutes > 0 && (
                <> · <span className="font-semibold text-foreground">이동 {formatTravelTime(totalTravelMinutes)}</span></>
              )}
            </div>
            {/* 일정 초기화 */}
            {!showClearConfirm ? (
              <button
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => setShowClearConfirm(true)}
                data-testid="clear-day-button"
              >
                <Trash2 className="h-3 w-3" />
                초기화
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  className="rounded-lg bg-destructive px-2.5 py-1 text-[10px] font-bold text-white hover:bg-destructive/90 transition-colors"
                  onClick={() => {
                    if (currentDay) clearDay(trip.id, currentDay.id)
                    setShowClearConfirm(false)
                  }}
                >
                  삭제 확인
                </button>
                <button
                  className="rounded-lg px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                  onClick={() => setShowClearConfirm(false)}
                >
                  취소
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* 하단 액션 */}
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <button
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold"
          onClick={() => setIsPlaceSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          장소 추가
        </button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2 rounded-xl border-border opacity-40" size="lg" disabled title="AI 추천 기능 준비 중">
            <Bot className="h-4 w-4" />
            AI 추천
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-border"
            size="lg"
            onClick={async () => {
              if (!trip) return
              const ok = await copyShareUrl(trip)
              setShareMessage(ok ? "링크가 복사되었습니다!" : "복사에 실패했습니다")
              setTimeout(() => setShareMessage(null), 2000)
            }}
            data-testid="share-button"
          >
            {shareMessage ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            {shareMessage ?? "공유"}
          </Button>
        </div>
      </div>

      {/* 장소 추가 시트 */}
      <PlaceSheet
        open={isPlaceSheetOpen}
        onOpenChange={setIsPlaceSheetOpen}
        cityId={cityId}
        tripId={trip.id}
        dayId={currentDay?.id ?? ""}
      />
    </div>
  )
}
