import { useState, useRef, useEffect } from "react"
import { Plus, X, Copy, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DaySchedule } from "@/types/schedule"

const DAY_COLORS = [
  "from-sakura-dark to-pink-400",
  "from-indigo to-blue-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-violet-500 to-purple-400",
  "from-cyan-500 to-sky-400",
  "from-rose-500 to-red-400",
]

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // 활성 탭이 바뀔 때 스크롤로 보이게
  useEffect(() => {
    activeTabRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeDayIndex])

  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3.5" data-testid="day-tabs">
      {/* 스크롤 가능한 탭 영역 */}
      <div ref={scrollRef} className="flex flex-1 items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
        {days.map((day, index) => {
          const colorClass = DAY_COLORS[index % DAY_COLORS.length]
          const isActive = index === activeDayIndex
          return (
            <div key={day.id} className="group relative shrink-0">
              <button
                ref={isActive ? activeTabRef : undefined}
                onClick={() => onSelectDay(index)}
                className={`relative whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition-all duration-200 lg:px-5 ${
                  isActive
                    ? `bg-gradient-to-r ${colorClass} text-white shadow-md`
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`day-tab-${day.dayNumber}`}
              >
                Day {day.dayNumber}
                {tripStartDate && (
                  <span className={`ml-1.5 text-xs font-normal ${isActive ? "text-white/80" : "text-muted-foreground/60"}`}>
                    {getDayDateLabel(tripStartDate, index)}
                  </span>
                )}
              </button>
              {/* 데스크톱: hover 시 삭제/복제 */}
              {days.length > 1 && isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveDay(day.id)
                  }}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white shadow-sm transition-opacity group-hover:opacity-100 lg:flex lg:opacity-0"
                  aria-label={`Day ${day.dayNumber} 삭제`}
                  data-testid={`day-remove-${day.dayNumber}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {isActive && onDuplicateDay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicateDay(day.id)
                  }}
                  className="absolute -left-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white shadow-sm transition-opacity group-hover:opacity-100 lg:flex lg:opacity-0"
                  aria-label={`Day ${day.dayNumber} 복제`}
                  data-testid={`day-duplicate-${day.dayNumber}`}
                >
                  <Copy className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 데스크톱: Day 추가 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="ml-1 hidden h-7 w-7 shrink-0 rounded-full hover:bg-sakura/20 lg:flex"
        onClick={onAddDay}
        aria-label="Day 추가"
        data-testid="day-add-btn"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>

      {/* 모바일: Day 관리 메뉴 */}
      <div className="relative shrink-0 lg:hidden">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
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
