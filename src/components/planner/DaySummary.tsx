import { useState } from "react"
import { BarChart3, Trash2 } from "lucide-react"
import { formatTravelTime } from "@/lib/utils"
import type { ScheduleItem, DaySchedule } from "@/types/schedule"

interface DaySummaryProps {
  currentDay: DaySchedule | undefined
  items: ScheduleItem[]
  allDaysFilled: boolean
  totalTravelMinutes: number
  onClearDay: () => void
}

export function DaySummary({ currentDay, items, allDaysFilled, totalTravelMinutes, onClearDay }: DaySummaryProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (items.length === 0) return null

  return (
    <div className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground flex flex-col gap-1" data-testid="day-summary">
      <div className="flex items-center justify-between">
        <div>
          <span className="mr-1 inline-flex items-center"><BarChart3 className="mr-1 inline h-3.5 w-3.5" /></span>Day {currentDay?.dayNumber} 요약 — <span className="font-semibold text-foreground">장소 {items.length}개</span>
          {totalTravelMinutes > 0 && (
            <> · <span className="font-semibold text-foreground">이동 {formatTravelTime(totalTravelMinutes)}</span></>
          )}
        </div>
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
                onClearDay()
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
      {allDaysFilled && (
        <p className="text-[10px] text-muted-foreground/70">여행이 모양새를 갖추고 있어요</p>
      )}
    </div>
  )
}
