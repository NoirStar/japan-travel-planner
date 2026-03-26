import { useRef, useEffect } from "react"
import { Plus } from "lucide-react"
import type { DaySchedule } from "@/types/schedule"

interface DayPillsProps {
  days: DaySchedule[]
  activeDayIndex: number
  onSelectDay: (index: number) => void
  onAddDay: () => void
  tripStartDate?: string | null
}

function getDayDateLabel(startDate: string, dayIndex: number): string {
  const d = new Date(startDate)
  d.setDate(d.getDate() + dayIndex)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function DayPills({ days, activeDayIndex, onSelectDay, onAddDay, tripStartDate }: DayPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeDayIndex])

  return (
    <div className="border-b border-border/50 px-3 py-2">
      <div ref={scrollRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {days.map((day, i) => {
          const active = i === activeDayIndex
          return (
            <button
              key={day.id}
              ref={active ? activeRef : undefined}
              onClick={() => onSelectDay(i)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`day-tab-${day.dayNumber}`}
            >
              Day {day.dayNumber}
              {tripStartDate && (
                <span className={`ml-1 text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                  {getDayDateLabel(tripStartDate, i)}
                </span>
              )}
              {day.items.length > 0 && (
                <span className={`ml-1 text-[10px] ${active ? "text-primary-foreground/60" : "text-muted-foreground/50"}`}>
                  ({day.items.length})
                </span>
              )}
            </button>
          )
        })}
        <button
          onClick={onAddDay}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Day 추가"
          data-testid="day-add-btn"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
