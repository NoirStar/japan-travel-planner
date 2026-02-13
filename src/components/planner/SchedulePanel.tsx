import { MapPin, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SchedulePanelProps {
  cityName?: string
}

export function SchedulePanel({ cityName }: SchedulePanelProps) {
  return (
    <div className="flex h-full flex-col" data-testid="schedule-panel">
      {/* 헤더 */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-bold">
          {cityName ? `🗾 ${cityName} 여행` : "🗾 새 여행 계획"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          장소를 추가하여 여행 일정을 만들어보세요
        </p>
      </div>

      {/* 일정 영역 (추후 구현) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 opacity-30" />
          <p className="text-sm">아직 추가된 장소가 없습니다</p>
          <p className="text-xs opacity-70">아래 버튼으로 장소를 추가해보세요</p>
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <Button className="w-full gap-2" size="lg">
          <MapPin className="h-4 w-4" />
          장소 추가
        </Button>
        <Button variant="outline" className="w-full gap-2" size="lg">
          <Bot className="h-4 w-4" />
          AI 추천받기
        </Button>
      </div>
    </div>
  )
}
