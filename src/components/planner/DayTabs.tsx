import { useState } from "react"
import { Plus, X, Copy, Settings2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DaySchedule } from "@/types/schedule"

interface DayTabsProps {
  days: DaySchedule[]
  activeDayIndex: number
  onSelectDay: (index: number) => void
  onAddDay: () => void
  onRemoveDay: (dayId: string) => void
  onDuplicateDay?: (dayId: string) => void
  tripStartDate?: string | null
}

/** startDate 기준으로 dayIndex만큼 후의 날짜를 "M/D" 포맷으로 반환 */
function getDayDateLabel(startDate: string, dayIndex: number): string {
  const d = new Date(startDate)
  d.setDate(d.getDate() + dayIndex)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function DayTabs({
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  tripStartDate,
}: DayTabsProps) {
  const [dayMenuOpen, setDayMenuOpen] = useState(false)
  const day = days[activeDayIndex]

  return (
    <div className="flex items-center gap-1 border-b border-border px-3 py-2 sm:px-4 sm:gap-1.5" data-testid="day-tabs">
      {/* ◀ 이전 Day */}
      <button
        onClick={() => onSelectDay(activeDayIndex - 1)}
        disabled={activeDayIndex <= 0}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-20 disabled:pointer-events-none"
        aria-label="이전 Day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* 현재 Day 표시 */}
      <div
        className={`rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground`}
        data-testid={`day-tab-${day?.dayNumber}`}
      >
        Day {day?.dayNumber ?? 1}
        {tripStartDate && (
          <span className="ml-1 text-[11px] font-normal text-primary-foreground/70">
            {getDayDateLabel(tripStartDate, activeDayIndex)}
          </span>
        )}
      </div>

      {/* ▶ 다음 Day */}
      <button
        onClick={() => onSelectDay(activeDayIndex + 1)}
        disabled={activeDayIndex >= days.length - 1}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-20 disabled:pointer-events-none"
        aria-label="다음 Day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Day N / Total 표시 */}
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {activeDayIndex + 1}/{days.length}
      </span>

      {/* 데스크톱: 인라인 복제/삭제 버튼 */}
      <div className="ml-auto hidden items-center gap-0.5 lg:flex">
        {onDuplicateDay && day && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => onDuplicateDay(day.id)}
            aria-label={`Day ${day.dayNumber} 복제`}
            data-testid={`day-duplicate-${day.dayNumber}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {days.length > 1 && day && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemoveDay(day.id)}
            aria-label={`Day ${day.dayNumber} 삭제`}
            data-testid={`day-remove-${day.dayNumber}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sakura/20"
          onClick={onAddDay}
          aria-label="Day 추가"
          data-testid="day-add-btn"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* 모바일: Day 관리 메뉴 */}
      <div className="relative ml-auto shrink-0 lg:hidden">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
          onClick={() => setDayMenuOpen(!dayMenuOpen)}
          aria-label="Day 관리"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
        {dayMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setDayMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-40 min-w-[140px] rounded-xl border border-border bg-card py-1 shadow-xl">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { onAddDay(); setDayMenuOpen(false) }}
              >
                <Plus className="h-3.5 w-3.5" /> Day 추가
              </button>
              {onDuplicateDay && days[activeDayIndex] && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => { onDuplicateDay(days[activeDayIndex].id); setDayMenuOpen(false) }}
                >
                  <Copy className="h-3.5 w-3.5" /> Day {days[activeDayIndex].dayNumber} 복제
                </button>
              )}
              {days.length > 1 && days[activeDayIndex] && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => { onRemoveDay(days[activeDayIndex].id); setDayMenuOpen(false) }}
                  >
                    <X className="h-3.5 w-3.5" /> Day {days[activeDayIndex].dayNumber} 삭제
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
