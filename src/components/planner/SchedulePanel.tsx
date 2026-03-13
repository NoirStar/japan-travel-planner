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
import { MapPin, Plus, Train, Footprints, TrainFront, Share2, Check, AlertTriangle, FileDown, Ticket, Heart, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { formatTravelTime, formatDistance } from "@/lib/utils"
import { DayTabs } from "./DayTabs"
import { PlaceCard } from "./PlaceCard"
import { SortablePlaceCard } from "./SortablePlaceCard"
import { PlaceSheet } from "./PlaceSheet"
import { ReservationCard } from "./ReservationCard"
import { ReservationSheet } from "./ReservationSheet"
import { TripHeader } from "./TripHeader"
import { DaySummary } from "./DaySummary"
import { RiskAlerts } from "./RiskAlerts"
import { WishlistPanel } from "./WishlistPanel"
import { ChecklistPanel } from "./ChecklistPanel"
import { useTravelTimes } from "@/hooks/useTravelTimes"
import { useScheduleRisks } from "@/hooks/useScheduleRisks"
import { useWishlistStore } from "@/stores/wishlistStore"
import { copyShareUrl } from "@/lib/shareUtils"
import type { Reservation } from "@/types/schedule"
import type { CollaborativeSyncResult } from "@/hooks/useCollaborativeSync"

interface SchedulePanelProps {
  cityId: string
  activeDayIndex: number
  onActiveDayIndexChange: (index: number) => void
  selectedPlaceId?: string | null
  onSelectPlace?: (placeId: string | null) => void
  collab?: CollaborativeSyncResult
}

export function SchedulePanel({ cityId, activeDayIndex, onActiveDayIndexChange, selectedPlaceId, onSelectPlace, collab }: SchedulePanelProps) {
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
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
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

  // 이동시간 계산 (hook)
  const { travelDataMap, totalTravelMinutes } = useTravelTimes(items)

  // 위시리스트 개수 (배지 표시용)
  const wishlistCount = useWishlistStore((s) => s.items.length)

  // 일정 리스크 분석
  const travelDataByDay = useMemo(() => {
    if (!trip) return undefined
    const m = new Map<number, Map<number, { minutes: number; mode: string; distanceKm: number }>>()
    // 현재 Day만 실시간 travelDataMap 사용
    if (currentDay) {
      m.set(currentDay.dayNumber, travelDataMap as Map<number, { minutes: number; mode: string; distanceKm: number }>)
    }
    return m
  }, [trip, currentDay, travelDataMap])
  const risks = useScheduleRisks(trip, travelDataByDay)

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
      <TripHeader
        trip={trip}
        isLoggedIn={!!user}
        onUpdateTrip={updateTrip}
        onDateChange={handleDateChange}
        collab={collab}
      />

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
                onEdit={() => { setEditingReservation(r); setIsReservationSheetOpen(true) }}
                onRemove={() => trip && removeReservation(trip.id, r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 일정 리스크 알림 */}
      <RiskAlerts risks={risks} currentDayNumber={currentDay?.dayNumber} />

      {/* Day 요약 */}
      <DaySummary
        currentDay={currentDay}
        items={items}
        allDaysFilled={allDaysFilled}
        totalTravelMinutes={totalTravelMinutes}
        onClearDay={() => { if (currentDay) clearDay(trip.id, currentDay.id) }}
      />

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
            className="relative flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsWishlistOpen(true)}
            data-testid="wishlist-button"
          >
            <Heart className="h-4 w-4 text-rose-500" />
            후보함
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            onClick={() => { setEditingReservation(null); setIsReservationSheetOpen(true) }}
            data-testid="add-reservation-button"
          >
            <Ticket className="h-4 w-4" />
            예약
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsChecklistOpen(true)}
            data-testid="checklist-button"
          >
            <ClipboardCheck className="h-4 w-4 text-emerald-500" />
            준비물
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

      {/* 후보함 */}
      <WishlistPanel
        open={isWishlistOpen}
        onOpenChange={setIsWishlistOpen}
        tripId={trip.id}
        dayId={currentDay?.id ?? ""}
      />

      {/* 준비물 체크리스트 */}
      <ChecklistPanel
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
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
