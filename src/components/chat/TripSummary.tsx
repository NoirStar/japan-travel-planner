import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WizardSelections, DayThemeId } from "@/types/wizard"
import { DAY_THEMES } from "@/types/wizard"
import { getPlaceById } from "@/data/places"
import { getPlacesForDayTheme } from "@/services/wizardEngine"

interface TripSummaryProps {
  selections: WizardSelections
  onConfirm: () => void
  onReset: () => void
}

export function TripSummary({ selections, onConfirm, onReset }: TripSummaryProps) {
  const { cityId, duration, dayThemes, meals } = selections
  if (!cityId || !duration || !dayThemes) return null

  const cityNames: Record<string, string> = {
    tokyo: "도쿄",
    osaka: "오사카",
    kyoto: "교토",
    fukuoka: "후쿠오카",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
      data-testid="trip-summary"
    >
      {/* 타이틀 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-bold">
          🗾 {cityNames[cityId] ?? cityId} {duration - 1}박{duration}일
        </h3>
      </div>

      {/* Day별 일정 */}
      {Array.from({ length: duration }, (_, i) => i + 1).map((dayNum) => {
        const themeId = dayThemes[dayNum] as DayThemeId
        const theme = DAY_THEMES.find((t) => t.id === themeId)
        const themePlaceIds = getPlacesForDayTheme(cityId, themeId, 2)

        const lunchId = meals?.[`${dayNum}-lunch`]
        const dinnerId = meals?.[`${dayNum}-dinner`]

        return (
          <div
            key={dayNum}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
            data-testid={`summary-day-${dayNum}`}
          >
            <h4 className="mb-3 font-bold text-sm">
              📋 Day {dayNum} — {theme?.emoji} {theme?.label ?? themeId}
            </h4>
            <div className="flex flex-col gap-2">
              {/* 오전 관광 */}
              {themePlaceIds[0] && (
                <SummaryPlaceRow time="09:00" placeId={themePlaceIds[0]} />
              )}
              {/* 점심 */}
              {lunchId && lunchId !== "__skipped__" && (
                <SummaryPlaceRow time="12:00" placeId={lunchId} />
              )}
              {/* 오후 관광 */}
              {themePlaceIds[1] && (
                <SummaryPlaceRow time="14:00" placeId={themePlaceIds[1]} />
              )}
              {/* 저녁 */}
              {dinnerId && dinnerId !== "__skipped__" && (
                <SummaryPlaceRow time="18:00" placeId={dinnerId} />
              )}
            </div>
          </div>
        )
      })}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          className="flex-1 gap-2"
          size="lg"
          data-testid="summary-confirm"
        >
          ✅ 이대로 진행
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          size="lg"
          data-testid="summary-reset"
        >
          🔄 다시 만들기
        </Button>
      </div>
    </motion.div>
  )
}

// ─── 장소 행 ─────────────────────────────────────────────
function SummaryPlaceRow({ time, placeId }: { time: string; placeId: string }) {
  const place = getPlaceById(placeId)
  if (!place) return null

  const CATEGORY_EMOJI: Record<string, string> = {
    restaurant: "🍜",
    attraction: "🏯",
    shopping: "🛍️",
    accommodation: "🏨",
    cafe: "☕",
    transport: "🚃",
    other: "📍",
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">
        {time}
      </span>
      <span>{CATEGORY_EMOJI[place.category] ?? "📍"}</span>
      <span className="font-medium">{place.name}</span>
      {place.rating && (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {place.rating}
        </span>
      )}
    </div>
  )
}
