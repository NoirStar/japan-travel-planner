import { Plus, X } from "lucide-react"
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
}

export function DayTabs({
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
  onRemoveDay,
}: DayTabsProps) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border/50 px-4 py-2.5" data-testid="day-tabs">
      {days.map((day, index) => {
        const colorClass = DAY_COLORS[index % DAY_COLORS.length]
        const isActive = index === activeDayIndex
        return (
          <div key={day.id} className="group relative">
            <button
              onClick={() => onSelectDay(index)}
              className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? `bg-gradient-to-r ${colorClass} text-white shadow-md`
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`day-tab-${day.dayNumber}`}
            >
              Day {day.dayNumber}
            </button>
            {days.length > 1 && isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveDay(day.id)
                }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                aria-label={`Day ${day.dayNumber} 삭제`}
                data-testid={`day-remove-${day.dayNumber}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
      <Button
        variant="ghost"
        size="icon"
        className="ml-1 h-7 w-7 rounded-full hover:bg-sakura/20"
        onClick={onAddDay}
        aria-label="Day 추가"
        data-testid="day-add-btn"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
