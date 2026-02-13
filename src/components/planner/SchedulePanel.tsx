import { useState } from "react"
import { MapPin, Bot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getPlaceById } from "@/data/places"
import { getCityConfig } from "@/data/mapConfig"
import { DayTabs } from "./DayTabs"
import { PlaceCard } from "./PlaceCard"
import { PlaceSheet } from "./PlaceSheet"

interface SchedulePanelProps {
  cityId: string
  activeDayIndex: number
  onActiveDayIndexChange: (index: number) => void
}

export function SchedulePanel({ cityId, activeDayIndex, onActiveDayIndexChange }: SchedulePanelProps) {
  const cityConfig = getCityConfig(cityId)
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const { addDay, removeDay, removeItem } = useScheduleStore()

  const [isPlaceSheetOpen, setIsPlaceSheetOpen] = useState(false)

  if (!trip) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground" data-testid="schedule-panel">
        <p className="text-sm">여행을 불러오는 중...</p>
      </div>
    )
  }

  const currentDay = trip.days[activeDayIndex]
  const items = currentDay?.items ?? []

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

  const handleRemoveItem = (itemId: string) => {
    if (!currentDay) return
    removeItem(trip.id, currentDay.id, itemId)
  }

  return (
    <div className="flex h-full flex-col" data-testid="schedule-panel">
      {/* 헤더 */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-bold">
          🗾 {cityConfig.name} 여행
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          장소를 추가하여 여행 일정을 만들어보세요
        </p>
      </div>

      {/* Day 탭 */}
      <DayTabs
        days={trip.days}
        activeDayIndex={activeDayIndex}
        onSelectDay={onActiveDayIndexChange}
        onAddDay={handleAddDay}
        onRemoveDay={handleRemoveDay}
      />

      {/* 일정 카드 리스트 */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="schedule-items">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 opacity-30" />
            <p className="text-sm">아직 추가된 장소가 없습니다</p>
            <p className="text-xs opacity-70">아래 버튼으로 장소를 추가해보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, index) => {
              const place = getPlaceById(item.placeId)
              if (!place) return null
              return (
                <PlaceCard
                  key={item.id}
                  place={place}
                  index={index}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Day 요약 */}
      {items.length > 0 && (
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground" data-testid="day-summary">
          📊 Day {currentDay?.dayNumber} 요약 — 장소 {items.length}개
        </div>
      )}

      {/* 하단 액션 */}
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => setIsPlaceSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          장소 추가
        </Button>
        <Button variant="outline" className="w-full gap-2" size="lg">
          <Bot className="h-4 w-4" />
          AI 추천받기
        </Button>
      </div>

      {/* 장소 추가 시트 */}
      <PlaceSheet
        open={isPlaceSheetOpen}
        onOpenChange={setIsPlaceSheetOpen}
        cityId={cityId}
        tripId={trip.id}
        dayId={currentDay?.id ?? ""}
      />
    </div>
  )
}
