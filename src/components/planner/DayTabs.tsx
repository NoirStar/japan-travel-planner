import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DaySchedule } from "@/types/schedule"

interface DayTabsProps {
  days: DaySchedule[]
  activeDayIndex: number
  onSelectDay: (index: number) => void
  onAddDay: () => void
  onRemoveDay: (dayId: string) => void
}

export function DayTabs({
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
  onRemoveDay,
}: DayTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-4 py-2" data-testid="day-tabs">
      {days.map((day, index) => (
        <div key={day.id} className="group relative">
          <button
            onClick={() => onSelectDay(index)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              index === activeDayIndex
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={`day-tab-${day.dayNumber}`}
          >
            Day {day.dayNumber}
          </button>
          {/* Day 삭제 (2개 이상일 때만, 활성 탭에만 표시) */}
          {days.length > 1 && index === activeDayIndex && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveDay(day.id)
              }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Day ${day.dayNumber} 삭제`}
              data-testid={`day-remove-${day.dayNumber}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="ml-1 h-8 w-8"
        onClick={onAddDay}
        aria-label="Day 추가"
        data-testid="day-add-btn"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
