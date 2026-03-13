import { useState, useEffect, useRef, useMemo } from "react"
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
import { MapPin, Plus, Train, BarChart3, Footprints, TrainFront, Calendar, Share2, Check, Save, Trash2, Pencil, ImagePlus, AlertTriangle, FileDown, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { estimateTravel, formatTravelTime, formatDistance } from "@/lib/utils"
import { getTravelTime } from "@/lib/travelTimes"
import type { TransportMode } from "@/lib/utils"
import { DayTabs } from "./DayTabs"
import { PlaceCard } from "./PlaceCard"
import { SortablePlaceCard } from "./SortablePlaceCard"
import { PlaceSheet } from "./PlaceSheet"
import { ReservationCard } from "./ReservationCard"
import { ReservationSheet } from "./ReservationSheet"
import { copyShareUrl } from "@/lib/shareUtils"
import type { Reservation } from "@/types/schedule"

interface SchedulePanelProps {
  cityId: string
  activeDayIndex: number
  onActiveDayIndexChange: (index: number) => void
  selectedPlaceId?: string | null
  onSelectPlace?: (placeId: string | null) => void
}

export function SchedulePanel({ cityId, activeDayIndex, onActiveDayIndexChange, selectedPlaceId, onSelectPlace }: SchedulePanelProps) {
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const { addDay, removeDay, removeItem, moveItem, updateItem, updateTrip, clearDay, duplicateDay, addReservation, updateReservation, removeReservation } = useScheduleStore()
  const { user } = useAuthStore()

  /** 날짜 변경 시 Day 수 자동 조정 */
  const [pendingDateReduce, setPendingDateReduce] = useState<{ tripId: string; diffDays: number; placesCount: number } | null>(null)

  const applyDateReduce = (tripId: string, diffDays: number) => {
    const latestTrip = useScheduleStore.getState().trips.find((t) => t.id === tripId)
    if (latestTrip) {
      for (let i = latestTrip.days.length - 1; i >= diffDays; i--) {
        removeDay(tripId, latestTrip.days[i].id)
      }
    }
    if (activeDayIndex >= diffDays) {
      onActiveDayIndexChange(diffDays - 1)
    }
  }

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
      // 삭제될 Day에 장소가 있는지 확인
      const latestTrip = useScheduleStore.getState().trips.find((t) => t.id === trip.id)
      if (latestTrip) {
        const placesInRemovedDays = latestTrip.days
          .slice(diffDays)
          .reduce((sum, d) => sum + d.items.length, 0)

        if (placesInRemovedDays > 0) {
          // 장소가 있으면 확인 요청
          setPendingDateReduce({ tripId: trip.id, diffDays, placesCount: placesInRemovedDays })
          return
        }
      }
      applyDateReduce(trip.id, diffDays)
    }
  }

  const [isPlaceSheetOpen, setIsPlaceSheetOpen] = useState(false)
  const [isReservationSheetOpen, setIsReservationSheetOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [coverUrl, setCoverUrl] = useState("")
  const [liveTravelDataMap, setLiveTravelDataMap] = useState<Map<number, { minutes: number; mode: TransportMode; distanceKm: number; source: "estimated" | "live" }>>(new Map())
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

  const currentDay = trip?.days[activeDayIndex]
  const items = useMemo(() => currentDay?.items ?? [], [currentDay?.items])

  // 현재 Day의 날짜 계산
  const currentDayDate = useMemo(() => {
    if (currentDay?.date) return currentDay.date
    if (trip?.startDate && currentDay) {
      const start = new Date(trip.startDate)
      start.setDate(start.getDate() + currentDay.dayNumber - 1)
      return start.toISOString().slice(0, 10)
    }
    return undefined
  }, [currentDay, trip?.startDate])

  // 현재 Day에 표시할 예약 (교통: 상단, 숙박: 하단)
  const { transportReservations, accommodationReservations } = useMemo(() => {
    const reservations = trip?.reservations ?? []
    if (!currentDayDate) return { transportReservations: [] as Reservation[], accommodationReservations: [] as Reservation[] }
    const transport: Reservation[] = []
    const accommodation: Reservation[] = []
    for (const r of reservations) {
      if (r.date === currentDayDate) {
        if (r.type === "accommodation") {
          accommodation.push(r)
        } else {
          transport.push(r)
        }
      } else if (r.type === "accommodation" && r.endDate && r.date < currentDayDate && r.endDate > currentDayDate) {
        // 숙박: 체크인~체크아웃 사이 날짜에도 표시
        accommodation.push(r)
      }
    }
    return { transportReservations: transport, accommodationReservations: accommodation }
  }, [trip?.reservations, currentDayDate])

  // 전체 일정 완성도 — 모든 Day에 장소가 있으면 완성
  const allDaysFilled = useMemo(() => {
    if (!trip || trip.days.length === 0) return false
    return trip.days.every((d) => d.items.length > 0)
  }, [trip])

  // sortable 아이디 배열 (메모이제이션)
  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  // 해석 불가 장소(orphan) 자동 정리
  useEffect(() => {
    if (!trip) return
    for (const day of trip.days) {
      const orphans = day.items.filter((item) => !getAnyPlaceById(item.placeId))
      for (const orphan of orphans) {
        removeItem(trip.id, day.id, orphan.id)
      }
    }
  }, [trip?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 이동시간 사전 계산 (메모이제이션)
  const estimatedTravelDataMap = useMemo(() => {
    const map = new Map<number, { minutes: number; mode: TransportMode; distanceKm: number }>()
    for (let i = 1; i < items.length; i++) {
      const prev = getAnyPlaceById(items[i - 1].placeId)
      const curr = getAnyPlaceById(items[i].placeId)
      if (prev && curr) {
        map.set(i, estimateTravel(prev.location.lat, prev.location.lng, curr.location.lat, curr.location.lng))
      }
    }
    return map
  }, [items])

  useEffect(() => {
    let cancelled = false

    async function hydrateTravelTimes() {
      if (items.length < 2) {
        setLiveTravelDataMap(new Map())
        return
      }

      const entries = await Promise.all(items.slice(1).map(async (item, offset) => {
        const index = offset + 1
        const prev = getAnyPlaceById(items[index - 1].placeId)
        const curr = getAnyPlaceById(item.placeId)
        if (!prev || !curr) return null

        const travel = await getTravelTime(
          prev.location.lat,
          prev.location.lng,
          curr.location.lat,
          curr.location.lng,
        )

        return [index, travel] as const
      }))

      if (cancelled) return

      setLiveTravelDataMap(new Map(entries.filter((entry): entry is readonly [number, { minutes: number; mode: TransportMode; distanceKm: number; source: "estimated" | "live" }] => entry !== null)))
    }

    void hydrateTravelTimes()

    return () => {
      cancelled = true
    }
  }, [items])

  const travelDataMap = useMemo(() => {
    if (liveTravelDataMap.size === 0) {
      return new Map(Array.from(estimatedTravelDataMap.entries()).map(([index, travel]) => [index, { ...travel, source: "estimated" as const }]))
    }

    const merged = new Map<number, { minutes: number; mode: TransportMode; distanceKm: number; source: "estimated" | "live" }>()
    for (const [index, travel] of estimatedTravelDataMap.entries()) {
      merged.set(index, { ...travel, source: "estimated" })
    }
    for (const [index, travel] of liveTravelDataMap.entries()) {
      merged.set(index, travel)
    }
    return merged
  }, [estimatedTravelDataMap, liveTravelDataMap])

  const totalTravelMinutes = useMemo(
    () => Array.from(travelDataMap.values()).reduce((sum, d) => sum + d.minutes, 0),
    [travelDataMap],
  )

  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground" data-testid="schedule-panel">
        <p className="text-sm">여행을 불러오는 중...</p>
      </div>
    )
  }

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

  const handleDuplicateDay = (dayId: string) => {
    duplicateDay(trip.id, dayId)
    // 복제 후 새 Day로 이동
    onActiveDayIndexChange(trip.days.length)
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
        {/* 커버 이미지 */}
        {trip.coverImage && (
          <div className="relative -mx-4 -mt-4 mb-3 h-28 overflow-hidden">
            <img src={trip.coverImage} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => { setShowCoverInput(true); setCoverUrl(trip.coverImage ?? "") }}
              className="absolute bottom-2 right-2 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* 여행 이름 (편집 가능) */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => {
                const trimmed = editTitle.trim()
                if (trimmed) updateTrip(trip.id, { title: trimmed })
                setIsEditingTitle(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const trimmed = editTitle.trim()
                  if (trimmed) updateTrip(trip.id, { title: trimmed })
                  setIsEditingTitle(false)
                } else if (e.key === "Escape") {
                  setIsEditingTitle(false)
                }
              }}
              maxLength={30}
              autoFocus
              className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-base font-bold outline-none focus:ring-2 focus:ring-primary/40"
            />
          ) : (
            <button
              onClick={() => { setEditTitle(trip.title); setIsEditingTitle(true) }}
              className="group flex items-center gap-1.5 text-left"
            >
              <h2 className="text-base font-bold">{trip.title}</h2>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          {!trip.coverImage && !showCoverInput && (
            <button
              onClick={() => { setShowCoverInput(true); setCoverUrl("") }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="커버 사진 추가"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 커버 URL 입력 */}
        {showCoverInput && (
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="커버 이미지 URL (https://...)"
              className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
            <Button
              size="sm"
              className="h-7 rounded-lg text-xs"
              onClick={() => {
                updateTrip(trip.id, { coverImage: coverUrl || undefined })
                setShowCoverInput(false)
              }}
            >
              저장
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg text-xs"
              onClick={() => setShowCoverInput(false)}
            >
              취소
            </Button>
          </div>
        )}
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
          {user ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500" data-testid="auto-save-indicator">
              <Save className="h-3 w-3" />
              자동 저장
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-500" data-testid="auto-save-indicator">
              <AlertTriangle className="h-3 w-3" />
              로그인 후 저장 가능
            </span>
          )}
        </div>
      </div>

      {/* Day 탭 */}
      <DayTabs
        days={trip.days}
        activeDayIndex={activeDayIndex}
        onSelectDay={onActiveDayIndexChange}
        onAddDay={handleAddDay}
        onRemoveDay={handleRemoveDay}
        onDuplicateDay={handleDuplicateDay}
        tripStartDate={trip.startDate}
      />

      {/* 일정 카드 리스트 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4" data-testid="schedule-items">
        {/* 교통 예약 (항공/기차/버스) — 장소 목록 상단 */}
        {transportReservations.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {transportReservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                position="transport"
                onEdit={() => { setEditingReservation(r); setIsReservationSheetOpen(true) }}
                onRemove={() => trip && removeReservation(trip.id, r.id)}
              />
            ))}
          </div>
        )}

        {items.length === 0 && transportReservations.length === 0 && accommodationReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MapPin className="h-7 w-7 text-primary/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Day {currentDay?.dayNumber}에 장소를 추가하세요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                아래 <span className="font-medium text-primary">"장소 추가"</span> 버튼을 누르거나,
                <br />지도에서 장소를 직접 클릭해도 추가됩니다
              </p>
            </div>
            <button
              onClick={() => setIsPlaceSheetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              장소 검색하기
            </button>
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

                  // 사전 계산된 이동시간 사용
                  const travelData = travelDataMap.get(index)
                  const travelMinutes = travelData?.minutes ?? 0
                  const travelMode = travelData?.mode ?? "metro"
                  const distanceKm = travelData?.distanceKm ?? 0

                  return (
                    <div key={item.id}>
                      {/* 이동시간 커넥터 */}
                      {travelData && (
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
                          {travelData?.source === "live" && (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                              ETA
                            </span>
                          )}
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

        {/* 빈 장소 + 예약만 있는 경우 장소 추가 안내 */}
        {items.length === 0 && (transportReservations.length > 0 || accommodationReservations.length > 0) && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-xs text-muted-foreground">장소를 추가하면 더 완성된 일정이 됩니다</p>
            <button
              onClick={() => setIsPlaceSheetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              장소 추가
            </button>
          </div>
        )}

        {/* 숙박 예약 — 장소 목록 하단 */}
        {accommodationReservations.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {accommodationReservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                position="accommodation"
                onEdit={() => { setEditingReservation(r); setIsReservationSheetOpen(true) }}
                onRemove={() => trip && removeReservation(trip.id, r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Day 요약 */}
      {items.length > 0 && (() => {
        return (
          <div className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground flex flex-col gap-1" data-testid="day-summary">
            <div className="flex items-center justify-between">
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
            {allDaysFilled && trip.days.length > 1 && (
              <p className="text-[10px] text-muted-foreground/70">여행이 모양새를 갖추고 있어요</p>
            )}
          </div>
        )
      })()}

      {/* 하단 액션 */}
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <div className="flex gap-2">
          <button
            className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold"
            onClick={() => setIsPlaceSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            장소 추가
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            onClick={() => { setEditingReservation(null); setIsReservationSheetOpen(true) }}
            data-testid="add-reservation-button"
          >
            <Ticket className="h-4 w-4" />
            예약
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl border-border"
            size="lg"
            onClick={async () => {
              if (!trip) return
              const ok = await copyShareUrl(trip)
              setShareMessage(ok ? "링크가 복사되었습니다!" : "복사에 실패했습니다")
              setTimeout(() => setShareMessage(null), 2000)
            }}
            data-testid="share-button"
          >
            {shareMessage === "링크가 복사되었습니다!" ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : shareMessage === "복사에 실패했습니다" ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {shareMessage ?? "공유"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl border-border"
            size="lg"
            onClick={async () => {
              if (!trip) return
              setShareMessage("PDF 생성 중...")
              const { downloadTripPdf } = await import("@/lib/exportPdf")
              const ok = await downloadTripPdf(trip)
              setShareMessage(ok ? "PDF가 다운로드되었습니다!" : "PDF 생성에 실패했습니다")
              setTimeout(() => setShareMessage(null), 2000)
            }}
            data-testid="export-pdf-button"
          >
            <FileDown className="h-4 w-4" />
            PDF
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

      {/* 예약 추가/편집 시트 */}
      <ReservationSheet
        open={isReservationSheetOpen}
        onOpenChange={(open) => {
          setIsReservationSheetOpen(open)
          if (!open) setEditingReservation(null)
        }}
        editData={editingReservation}
        defaultDate={currentDayDate}
        onSubmit={(data) => {
          if (!trip) return
          if (editingReservation) {
            updateReservation(trip.id, editingReservation.id, data)
          } else {
            addReservation(trip.id, data)
          }
        }}
      />

      {/* 날짜 축소 확인 */}
      <ConfirmDialog
        open={!!pendingDateReduce}
        onOpenChange={(open) => { if (!open) setPendingDateReduce(null) }}
        title="일정이 있는 날이 삭제됩니다"
        description={`삭제될 Day에 장소 ${pendingDateReduce?.placesCount ?? 0}개가 포함되어 있습니다. 계속하시겠습니까?`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={() => {
          if (pendingDateReduce) {
            applyDateReduce(pendingDateReduce.tripId, pendingDateReduce.diffDays)
          }
        }}
      />
    </div>
  )
}
