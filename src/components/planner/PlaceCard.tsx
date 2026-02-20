import { forwardRef, useState, useRef, useEffect } from "react"
import { X, Star, GripVertical, Clock, StickyNote, ChevronDown, ChevronUp } from "lucide-react"
import type { DraggableAttributes } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"

interface PlaceCardProps {
  place: Place
  index: number
  onRemove: () => void
  /** 시간대 (HH:mm) */
  startTime?: string
  /** 메모 */
  memo?: string
  /** 시간 변경 콜백 */
  onStartTimeChange?: (time: string) => void
  /** 메모 변경 콜백 */
  onMemoChange?: (memo: string) => void
  /** 선택 상태 */
  isSelected?: boolean
  /** 카드 클릭 콜백 */
  onClick?: () => void
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
    { place, index, onRemove, startTime, memo, onStartTimeChange, onMemoChange, isSelected, onClick, dragHandleListeners, dragHandleAttributes, style, isDragging },
    ref,
  ) {
    const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
    const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
    const gradientClass = CATEGORY_GRADIENT[place.category] ?? "from-gray-400 to-slate-400"
    const [isEditingTime, setIsEditingTime] = useState(false)
    const [showMemo, setShowMemo] = useState(!!memo)
    const timeInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isEditingTime && timeInputRef.current) {
        timeInputRef.current.focus()
      }
    }, [isEditingTime])

    return (
      <div
        ref={ref}
        className={`group relative overflow-hidden rounded-2xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${
          isSelected
            ? "border-sakura ring-2 ring-sakura/30 shadow-lg"
            : "border-border/50 hover:border-sakura/30"
        } ${isDragging ? "opacity-50 shadow-xl ring-2 ring-sakura-dark scale-[1.02]" : ""}`}
        style={style}
        data-testid={`place-card-${index}`}
        onClick={onClick}
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
          onClick={(e) => { e.stopPropagation(); onRemove() }}
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

            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {/* 시간대 표시/편집 */}
              {isEditingTime ? (
                <input
                  ref={timeInputRef}
                  type="time"
                  defaultValue={startTime ?? ""}
                  className="h-5 w-[72px] rounded bg-muted/80 px-1 text-[10px] font-medium text-foreground outline-none ring-1 ring-sakura/40 focus:ring-sakura"
                  onBlur={(e) => {
                    setIsEditingTime(false)
                    onStartTimeChange?.(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingTime(false)
                      onStartTimeChange?.((e.target as HTMLInputElement).value)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`time-input-${index}`}
                />
              ) : (
                <button
                  className="flex items-center gap-0.5 rounded-full bg-sakura/10 px-2 py-0.5 text-[10px] font-medium text-sakura-dark dark:text-sakura hover:bg-sakura/20 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setIsEditingTime(true) }}
                  data-testid={`time-badge-${index}`}
                >
                  <Clock className="h-3 w-3" />
                  {startTime || "시간 설정"}
                </button>
              )}

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

            {/* 메모 토글 */}
            <button
              className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowMemo(!showMemo) }}
              data-testid={`memo-toggle-${index}`}
            >
              <StickyNote className="h-3 w-3" />
              {memo ? "메모 보기" : "메모 추가"}
              {showMemo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {/* 메모 입력 */}
            {showMemo && (
              <textarea
                className="mt-1 w-full resize-none rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-sakura/40"
                placeholder="메모를 입력하세요..."
                rows={2}
                defaultValue={memo ?? ""}
                onBlur={(e) => onMemoChange?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                data-testid={`memo-input-${index}`}
              />
            )}
          </div>
        </div>
      </div>
    )
  },
)
