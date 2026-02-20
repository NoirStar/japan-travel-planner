import { motion } from "framer-motion"
import { Star, Map, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WizardSelections, DayThemeId } from "@/types/wizard"
import { DAY_THEMES } from "@/types/wizard"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { getPlacesForDayTheme } from "@/services/wizardEngine"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { THEME_ICONS } from "@/lib/categoryIcons"

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
      className="flex flex-col gap-3"
      data-testid="trip-summary"
    >
      {/* 타이틀 */}
      <div className="rounded-2xl bg-gradient-to-r from-sakura-dark to-indigo p-4 text-white shadow-lg">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Map className="h-5 w-5" /> {cityNames[cityId] ?? cityId} {duration - 1}박{duration}일
        </h3>
        <p className="mt-1 text-sm text-white/70">여행 일정이 완성되었어요!</p>
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
            className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50"
            data-testid={`summary-day-${dayNum}`}
          >
            <h4 className="mb-3 font-bold text-sm flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sakura-dark to-indigo text-[10px] text-white">D{dayNum}</span>
              {(() => { const ThemeIcon = THEME_ICONS[themeId]; return ThemeIcon ? <ThemeIcon className="h-4 w-4 text-muted-foreground" /> : null })()}
              {theme?.label ?? themeId}
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
        <button
          onClick={onConfirm}
          className="btn-gradient flex-1 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-1.5"
          data-testid="summary-confirm"
        >
          <CheckCircle className="h-4 w-4" /> 이대로 진행
        </button>
        <Button
          variant="outline"
          onClick={onReset}
          size="lg"
          className="rounded-xl border-border/60 gap-1.5"
          data-testid="summary-reset"
        >
          <RefreshCw className="h-4 w-4" /> 다시 만들기
        </Button>
      </div>
    </motion.div>
  )
}

// ─── 장소 행 ─────────────────────────────────────────────
function SummaryPlaceRow({ time, placeId }: { time: string; placeId: string }) {
  const place = getAnyPlaceById(placeId)
  if (!place) return null

  const PlaceIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">
        {time}
      </span>
      <PlaceIcon className="h-4 w-4 text-muted-foreground" />
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
