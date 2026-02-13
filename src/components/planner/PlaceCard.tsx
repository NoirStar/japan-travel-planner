import { forwardRef } from "react"
import { X, Star, GripVertical } from "lucide-react"
import type { DraggableAttributes } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"

interface PlaceCardProps {
  place: Place
  index: number
  onRemove: () => void
  /** dnd-kit에서 전달하는 드래그 핸들 리스너 */
  dragHandleListeners?: Record<string, unknown>
  /** dnd-kit에서 전달하는 드래그 핸들 어트리뷰트 */
  dragHandleAttributes?: DraggableAttributes
  /** 드래그 중 스타일 (opacity 등) */
  style?: React.CSSProperties
  /** 드래그 중 여부 */
  isDragging?: boolean
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

export const PlaceCard = forwardRef<HTMLDivElement, PlaceCardProps>(
  function PlaceCard(
    { place, index, onRemove, dragHandleListeners, dragHandleAttributes, style, isDragging },
    ref,
  ) {
    const emoji = CATEGORY_EMOJI[place.category] ?? "📍"
    const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

    return (
      <div
        ref={ref}
        className={`group relative rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
          isDragging ? "opacity-50 shadow-lg ring-2 ring-primary" : ""
        }`}
        style={style}
        data-testid={`place-card-${index}`}
      >
        {/* 드래그 핸들 */}
        <button
          className="absolute -left-2 -top-2 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow active:cursor-grabbing"
          aria-label={`${place.name} 순서 변경`}
          data-testid={`drag-handle-${index}`}
          {...dragHandleListeners}
          {...dragHandleAttributes}
        >
          {index + 1}
        </button>

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
          {/* 드래그 힌트 아이콘 */}
          <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />

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
  },
)
