import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { MapPin, Plus, Train, Footprints, TrainFront, Share2, FileDown, CalendarDays, Ticket, Bookmark, ClipboardCheck, MoreHorizontal, Wallet, PenLine, History, Paperclip } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { formatTravelTime, formatDistance } from "@/lib/utils"
import { DayTabs } from "./DayTabs"
import { PlaceCard } from "./PlaceCard"
import { PlaceSheet } from "./PlaceSheet"
import { ReservationCard } from "./ReservationCard"
import { ReservationSheet } from "./ReservationSheet"
import { TripHeader } from "./TripHeader"
import { DaySummary } from "./DaySummary"
import { RiskAlerts } from "./RiskAlerts"
import { WishlistPanel } from "./WishlistPanel"
import { ChecklistPanel } from "./ChecklistPanel"
import { BudgetPanel } from "./BudgetPanel"
import { TransportPassPanel } from "./TransportPassPanel"
import { ChangeHistoryPanel } from "./ChangeHistoryPanel"
import { AttachmentVault } from "./AttachmentVault"
import { useTravelTimes } from "@/hooks/useTravelTimes"
import { useScheduleRisks } from "@/hooks/useScheduleRisks"
import { copyShareUrl } from "@/lib/shareUtils"
import { showToast } from "@/components/ui/CelebrationOverlay"
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
  const navigate = useNavigate()

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

    // 유효한 날짜인지 검증
    if (value && Number.isNaN(new Date(value).getTime())) return

    // startDate > endDate 방지
    const start = field === "startDate" ? value : trip.startDate
    const end = field === "endDate" ? value : trip.endDate
    if (start && end) {
      if (start > end) {
        // 역전 시 반대쪽도 같이 보정
        if (field === "startDate") {
          updateTrip(trip.id, { startDate: value, endDate: value })
        } else {
          updateTrip(trip.id, { startDate: value, endDate: value })
        }
      } else {
        updateTrip(trip.id, { [field]: value })
      }
    } else {
      updateTrip(trip.id, { [field]: value })
    }

    // 양쪽 날짜가 모두 설정된 경우 Day 수 조정
    const effectiveStart = field === "startDate" ? value : trip.startDate
    const effectiveEnd = field === "endDate" ? value : trip.endDate
    if (!effectiveStart || !effectiveEnd) return
    if (effectiveStart > effectiveEnd) return

    const startDate = new Date(effectiveStart)
    const endDate = new Date(effectiveEnd)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return

    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (diffDays < 1 || diffDays > 30) return

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
  const [isBudgetOpen, setIsBudgetOpen] = useState(false)
  const [isTransportPassOpen, setIsTransportPassOpen] = useState(false)
  const [isChangeHistoryOpen, setIsChangeHistoryOpen] = useState(false)
  const [isAttachmentVaultOpen, setIsAttachmentVaultOpen] = useState(false)
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 마커 클릭 시 해당 카드로 자동 스크롤
  useEffect(() => {
    if (!selectedPlaceId || !scrollContainerRef.current) return
    const card = scrollContainerRef.current.querySelector(`[data-place-id="${selectedPlaceId}"]`)
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [selectedPlaceId])

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

  // 현재 Day에 표시할 예약
  const dayReservations = useMemo(() => {
    const reservations = trip?.reservations ?? []
    if (!currentDayDate) return [] as Reservation[]
    const result: Reservation[] = []
    for (const r of reservations) {
      if (r.date === currentDayDate) {
        result.push(r)
      } else if (r.type === "accommodation" && r.endDate && r.date < currentDayDate && r.endDate > currentDayDate) {
        result.push(r)
      }
    }
    return result
  }, [trip?.reservations, currentDayDate])

  // 장소 + 예약을 시간순으로 통합 정렬
  type TimelineEntry =
    | { kind: "place"; item: typeof items[number]; place: import("@/types/place").Place; index: number }
    | { kind: "reservation"; reservation: Reservation }

  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = []

    // 장소 항목
    let placeIdx = 0
    for (const item of items) {
      const place = getAnyPlaceById(item.placeId)
      if (!place) continue
      entries.push({ kind: "place", item, place, index: placeIdx++ })
    }

    // 예약 항목
    for (const r of dayReservations) {
      entries.push({ kind: "reservation", reservation: r })
    }

    // 시간순 정렬 (시간 없는 항목은 뒤로)
    const timeToMin = (t?: string) => {
      if (!t) return Infinity
      const [h, m] = t.split(":").map(Number)
      return h * 60 + (m || 0)
    }

    entries.sort((a, b) => {
      const tA = a.kind === "place" ? timeToMin(a.item.startTime) : timeToMin(a.reservation.startTime)
      const tB = b.kind === "place" ? timeToMin(b.item.startTime) : timeToMin(b.reservation.startTime)
      return tA - tB
    })

    return entries
  }, [items, dayReservations])

  // 전체 일정 완성도 — 모든 Day에 장소가 있으면 완성
  const allDaysFilled = useMemo(() => {
    if (!trip || trip.days.length === 0) return false
    return trip.days.every((d) => d.items.length > 0)
  }, [trip])

  // 이동시간 계산 (hook)
  const { travelDataMap, totalTravelMinutes } = useTravelTimes(items)

  // 위시리스트 개수 (배지 표시용)
  const wishlistCount = trip?.wishlist?.length ?? 0

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

  // ── 순서 변경 핸들러 (버튼식) ──────────────────────────
  const handleMoveItem = useCallback((itemId: string, direction: "up" | "down" | "top" | "bottom") => {
    if (!trip || !currentDay) return
    const idx = currentDay.items.findIndex((i) => i.id === itemId)
    if (idx === -1) return
    const lastIdx = currentDay.items.length - 1
    let newIdx: number
    switch (direction) {
      case "up":    newIdx = Math.max(0, idx - 1); break
      case "down":  newIdx = Math.min(lastIdx, idx + 1); break
      case "top":   newIdx = 0; break
      case "bottom": newIdx = lastIdx; break
    }
    if (newIdx === idx) return
    moveItem(trip.id, currentDay.id, currentDay.id, itemId, newIdx)
  }, [trip, currentDay, moveItem])

  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground" data-testid="schedule-panel">
        <p className="text-sm">여행을 불러오는 중...</p>
      </div>
    )
  }

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

  return (
    <div className="flex h-full flex-col" data-testid="schedule-panel">
      {/* 헤더 */}
      <TripHeader
        trip={trip}
        isLoggedIn={!!user}
        onUpdateTrip={updateTrip}
        onDateChange={handleDateChange}
        onCitiesChange={(newCities) => updateTrip(trip.id, { cities: newCities })}
        onVisibilityChange={(v) => updateTrip(trip.id, { visibility: v })}
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0" data-testid="schedule-items">
        {timeline.length === 0 ? (
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
          <div className="flex flex-col">
            {timeline.map((entry, tIdx) => {
              if (entry.kind === "reservation") {
                return (
                  <div key={entry.reservation.id} className={tIdx > 0 ? "mt-2" : ""}>
                    <ReservationCard
                      reservation={entry.reservation}
                      onEdit={() => { setEditingReservation(entry.reservation); setIsReservationSheetOpen(true) }}
                      onRemove={() => trip && removeReservation(trip.id, entry.reservation.id)}
                    />
                  </div>
                )
              }

              const { item, place, index } = entry
              // 이동시간: place 항목 사이에만 표시
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
                  <PlaceCard
                    place={place}
                    index={index}
                    totalItems={items.length}
                    onRemove={() => handleRemoveItem(item.id)}
                    onMoveItem={(direction) => handleMoveItem(item.id, direction)}
                    startTime={item.startTime}
                    memo={item.memo}
                    onStartTimeChange={(time) => {
                      if (trip && currentDay) updateItem(trip.id, currentDay.id, item.id, { startTime: time })
                    }}
                    onMemoChange={(memoValue) => {
                      if (trip && currentDay) updateItem(trip.id, currentDay.id, item.id, { memo: memoValue })
                    }}
                    cost={item.cost}
                    costCategory={item.costCategory}
                    onCostChange={(costVal, cat) => {
                      if (trip && currentDay) updateItem(trip.id, currentDay.id, item.id, { cost: costVal, costCategory: cat })
                    }}
                    isSelected={selectedPlaceId === item.placeId}
                    onClick={() => onSelectPlace?.(item.placeId === selectedPlaceId ? null : item.placeId)}
                  />
                </div>
              )
            })}

            {/* 장소 없이 예약만 있으면 장소 추가 안내 */}
            {items.length === 0 && dayReservations.length > 0 && (
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
          </div>
        )}
      </div>

      {/* 일정 리스크 알림 */}
      <RiskAlerts risks={risks} currentDayNumber={currentDay?.dayNumber} />

      {/* 여행 완료 후기 배너 */}
      {trip.endDate && new Date(trip.endDate + "T23:59:59") < new Date() && user && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <PenLine className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">여행이 끝났어요!</p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70">커뮤니티에 후기를 남겨보세요</p>
          </div>
          <button
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
            onClick={() => navigate("/community", { state: { openCreatePost: true, tripId: trip.id } })}
          >
            후기 작성
          </button>
        </div>
      )}

      {/* Day 요약 */}
      <DaySummary
        currentDay={currentDay}
        items={items}
        allDaysFilled={allDaysFilled}
        totalTravelMinutes={totalTravelMinutes}
        onClearDay={() => { if (currentDay) clearDay(trip.id, currentDay.id) }}
      />

      {/* 하단 액션 — 모바일: 장소 추가 + 더보기 / 데스크톱: 기존 유지 */}
      <div className="flex flex-col gap-2 border-t border-border p-4">
        {/* 모바일 하단 (lg 미만) */}
        <div className="flex gap-2 lg:hidden">
          <button
            className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold"
            onClick={() => setIsPlaceSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            장소 추가
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsMobileMoreOpen(true)}
          >
            <MoreHorizontal className="h-4 w-4" />
            더보기
          </button>
        </div>
        {/* 데스크톱 하단 (lg 이상) */}
        <div className="hidden lg:flex gap-2">
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
            <Bookmark className="h-4 w-4 text-rose-500" />
            북마크
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
        {/* 보조 도구 — 데스크톱에서만 표시 */}
        <div className="hidden lg:flex gap-1.5">
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={() => { setEditingReservation(null); setIsReservationSheetOpen(true) }}
            data-testid="add-reservation-button"
          >
            <Ticket className="h-4 w-4" />
            예약
          </button>
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsChecklistOpen(true)}
            data-testid="checklist-button"
          >
            <ClipboardCheck className="h-4 w-4 text-emerald-500" />
            준비물
          </button>
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsBudgetOpen(true)}
            data-testid="budget-button"
          >
            <Wallet className="h-4 w-4 text-emerald-500" />
            예산
          </button>
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={() => setIsTransportPassOpen(true)}
            data-testid="transport-pass-button"
          >
            <TrainFront className="h-4 w-4 text-blue-500" />
            패스
          </button>
          {collab?.isShared && (
            <button
              className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsChangeHistoryOpen(true)}
              data-testid="change-history-button"
            >
              <History className="h-4 w-4 text-violet-500" />
              이력
            </button>
          )}
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              if (!trip) return
              const ok = await copyShareUrl(trip)
              showToast(ok ? "링크가 복사되었습니다!" : "복사에 실패했습니다")
            }}
            data-testid="share-button"
          >
            <Share2 className="h-4 w-4" />
            공유
          </button>
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              if (!trip) return
              showToast("PDF 생성 중...")
              const { downloadTripPdf } = await import("@/lib/exportPdf")
              const result = await downloadTripPdf(trip)
              showToast(result.ok ? "PDF가 다운로드되었습니다!" : (result.error ?? "PDF 생성에 실패했습니다"))
            }}
            data-testid="export-pdf-button"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
          <button
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border bg-card py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              if (!trip) return
              const { downloadTripIcs } = await import("@/lib/exportIcs")
              downloadTripIcs(trip)
              showToast("캘린더 파일이 다운로드되었습니다!")
            }}
            data-testid="export-ics-button"
          >
            <CalendarDays className="h-4 w-4" />
            캘린더
          </button>
        </div>
      </div>

      {/* 모바일 더보기 bottom sheet */}
      {isMobileMoreOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsMobileMoreOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card shadow-2xl lg:hidden animate-in slide-in-from-bottom duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex flex-col gap-1 px-4 pb-4">
              <button
                className="relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { setIsMobileMoreOpen(false); setIsWishlistOpen(true) }}
              >
                <Bookmark className="h-5 w-5 text-rose-500" />
                북마크
                {wishlistCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { setIsMobileMoreOpen(false); setEditingReservation(null); setIsReservationSheetOpen(true) }}
              >
                <Ticket className="h-5 w-5" />
                예약 관리
              </button>
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { setIsMobileMoreOpen(false); setIsChecklistOpen(true) }}
              >
                <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                준비물 체크리스트
              </button>
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { setIsMobileMoreOpen(false); setIsBudgetOpen(true) }}
              >
                <Wallet className="h-5 w-5 text-emerald-500" />
                여행 예산
              </button>
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { setIsMobileMoreOpen(false); setIsTransportPassOpen(true) }}
              >
                <TrainFront className="h-5 w-5 text-blue-500" />
                교통 패스 계산기
              </button>
              {collab?.isShared && (
                <button
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => { setIsMobileMoreOpen(false); setIsChangeHistoryOpen(true) }}
                >
                  <History className="h-5 w-5 text-violet-500" />
                  변경 이력
                </button>
              )}
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { setIsMobileMoreOpen(false); setIsAttachmentVaultOpen(true) }}
              >
                <Paperclip className="h-5 w-5 text-teal-500" />
                첨부 보관함
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={async () => {
                  setIsMobileMoreOpen(false)
                  if (!trip) return
                  const ok = await copyShareUrl(trip)
                  showToast(ok ? "링크가 복사되었습니다!" : "복사에 실패했습니다")
                }}
              >
                <Share2 className="h-5 w-5" />
                공유 링크 복사
              </button>
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={async () => {
                  setIsMobileMoreOpen(false)
                  if (!trip) return
                  showToast("PDF 생성 중...")
                  const { downloadTripPdf } = await import("@/lib/exportPdf")
                  const result = await downloadTripPdf(trip)
                  showToast(result.ok ? "PDF가 다운로드되었습니다!" : (result.error ?? "PDF 생성에 실패했습니다"))
                }}
              >
                <FileDown className="h-5 w-5" />
                PDF 다운로드
              </button>
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={async () => {
                  setIsMobileMoreOpen(false)
                  if (!trip) return
                  const { downloadTripIcs } = await import("@/lib/exportIcs")
                  downloadTripIcs(trip)
                  showToast("캘린더 파일이 다운로드되었습니다!")
                }}
              >
                <CalendarDays className="h-5 w-5" />
                캘린더 내보내기
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                className="flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMobileMoreOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}

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
        tripId={trip.id}
      />

      {/* 여행 예산 */}
      <BudgetPanel
        open={isBudgetOpen}
        onOpenChange={setIsBudgetOpen}
        tripId={trip.id}
      />

      {/* 교통 패스 계산기 */}
      <TransportPassPanel
        open={isTransportPassOpen}
        onOpenChange={setIsTransportPassOpen}
        tripId={trip.id}
      />

      {/* 변경 이력 패널 (협업 시) */}
      {collab?.isShared && trip.sharedId && (
        <ChangeHistoryPanel
          open={isChangeHistoryOpen}
          onClose={() => setIsChangeHistoryOpen(false)}
          sharedId={trip.sharedId}
        />
      )}

      {/* 첨부 보관함 */}
      <AttachmentVault
        open={isAttachmentVaultOpen}
        onOpenChange={setIsAttachmentVaultOpen}
        tripId={trip.id}
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
