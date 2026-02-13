import { X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"

interface PlaceCardProps {
  place: Place
  index: number
  onRemove: () => void
}

/** 카테고리별 이모지 */
const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍜",
  attraction: "🏯",
  shopping: "🛍️",
  accommodation: "🏨",
  cafe: "☕",
  transport: "🚃",
  other: "📍",
}

export function PlaceCard({ place, index, onRemove }: PlaceCardProps) {
  const emoji = CATEGORY_EMOJI[place.category] ?? "📍"
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  return (
    <div
      className="group relative rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
      data-testid={`place-card-${index}`}
    >
      {/* 순서 번호 */}
      <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
        {index + 1}
      </div>

      {/* 삭제 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
        aria-label={`${place.name} 삭제`}
        data-testid={`place-remove-${index}`}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3 pl-3">
        {/* 이모지 아이콘 */}
        <span className="mt-0.5 text-xl" role="img" aria-label={categoryLabel}>
          {emoji}
        </span>

        <div className="min-w-0 flex-1">
          {/* 장소 이름 */}
          <h3 className="font-semibold leading-tight">{place.name}</h3>
          <p className="text-xs text-muted-foreground">{place.nameEn}</p>

          {/* 카테고리 + 평점 */}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">
              {categoryLabel}
            </span>
            {place.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {place.rating}
              </span>
            )}
          </div>

          {/* 설명 */}
          {place.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground/80">
              {place.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
