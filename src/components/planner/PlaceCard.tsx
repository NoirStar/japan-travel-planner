import { forwardRef } from "react"
import { X, Star, GripVertical } from "lucide-react"
import type { DraggableAttributes } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"

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

/** 카테고리별 그라데이션 색상 */
const CATEGORY_GRADIENT: Record<string, string> = {
  restaurant: "from-orange-400 to-red-400",
  attraction: "from-sakura-dark to-pink-400",
  shopping: "from-violet-400 to-purple-400",
  accommodation: "from-blue-400 to-indigo",
  cafe: "from-amber-400 to-yellow-500",
  transport: "from-emerald-400 to-teal-400",
  other: "from-gray-400 to-slate-400",
}

export const PlaceCard = forwardRef<HTMLDivElement, PlaceCardProps>(
  function PlaceCard(
    { place, index, onRemove, dragHandleListeners, dragHandleAttributes, style, isDragging },
    ref,
  ) {
    const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
    const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
    const gradientClass = CATEGORY_GRADIENT[place.category] ?? "from-gray-400 to-slate-400"

    return (
      <div
        ref={ref}
        className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-sakura/30 ${
          isDragging ? "opacity-50 shadow-xl ring-2 ring-sakura-dark scale-[1.02]" : ""
        }`}
        style={style}
        data-testid={`place-card-${index}`}
      >
        {/* 좌측 컬러 스트라이프 */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientClass}`} />

        {/* 드래그 핸들 — 번호 배지 */}
        <button
          className={`absolute -left-1 top-3 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} text-[10px] font-bold text-white shadow-md active:cursor-grabbing`}
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
          className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
          onClick={onRemove}
          aria-label={`${place.name} 삭제`}
          data-testid={`place-remove-${index}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-start gap-2.5 pl-5">
          {/* 드래그 힌트 아이콘 */}
          <GripVertical className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />

          {/* 카테고리 아이콘 */}
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
            <CategoryIcon className="h-5 w-5 text-muted-foreground" aria-label={categoryLabel} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-tight">{place.name}</h3>
            <p className="text-[11px] text-muted-foreground/70">{place.nameEn}</p>

            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {categoryLabel}
              </span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {place.rating}
                </span>
              )}
            </div>

            {place.description && (
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70">
                {place.description}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  },
)
