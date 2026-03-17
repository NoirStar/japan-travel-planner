import { forwardRef, useState, useRef, useEffect } from "react"
import { X, Star, Clock, StickyNote, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"

interface PlaceCardProps {
  place: Place
  index: number
  /** 전체 아이템 수 (첫/마지막 판별) */
  totalItems?: number
  onRemove: () => void
  /** 이동 콜백 */
  onMoveItem?: (direction: "up" | "down" | "top" | "bottom") => void
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

/** 시간대(아침/오전/점심 등) 분류 */
function getTimeSlotLabel(time: string): { label: string; color: string } | null {
  if (!time) return null
  const [h] = time.split(":").map(Number)
  if (h >= 6 && h < 9) return { label: "아침", color: "text-orange-500" }
  if (h >= 9 && h < 12) return { label: "오전", color: "text-sky-500" }
  if (h >= 12 && h < 14) return { label: "점심", color: "text-amber-600" }
  if (h >= 14 && h < 17) return { label: "오후", color: "text-emerald-500" }
  if (h >= 17 && h < 20) return { label: "저녁", color: "text-indigo" }
  return { label: "밤", color: "text-violet-500" }
}

export const PlaceCard = forwardRef<HTMLDivElement, PlaceCardProps>(
  function PlaceCard(
    { place, index, totalItems = 1, onRemove, onMoveItem, startTime, memo, onStartTimeChange, onMemoChange, isSelected, onClick },
    ref,
  ) {
    const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
    const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
    const gradientClass = CATEGORY_GRADIENT[place.category] ?? "from-gray-400 to-slate-400"
    const [isEditingTime, setIsEditingTime] = useState(false)
    const [showMemo, setShowMemo] = useState(!!memo)
    const timeInputRef = useRef<HTMLInputElement>(null)

    const isFirst = index === 0
    const isLast = index === totalItems - 1

    useEffect(() => {
      if (isEditingTime && timeInputRef.current) {
        timeInputRef.current.focus()
      }
    }, [isEditingTime])

    return (
      <div
        ref={ref}
        className={`group relative overflow-hidden rounded-2xl border bg-card p-3 transition-all duration-200 hover:shadow-md cursor-pointer ${
          isSelected
            ? "border-sakura-dark shadow-md"
            : "border-border hover:border-sakura/40"
        }`}
        data-testid={`place-card-${index}`}
        data-place-id={place.id}
        onClick={onClick}
      >
        {/* 좌측 컬러 스트라이프 */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientClass}`} />

        {/* 번호 배지 */}
        <div
          className={`absolute -left-1 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} text-[10px] font-bold text-white shadow-md`}
        >
          {index + 1}
        </div>

        {/* 순서 변경 버튼 — 우측 상단 */}
        {onMoveItem && totalItems > 1 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" data-testid={`reorder-buttons-${index}`}>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={(e) => { e.stopPropagation(); onMoveItem("top") }}
              disabled={isFirst}
              aria-label="맨 위로"
              data-testid={`move-top-${index}`}
            >
              <ChevronsUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={(e) => { e.stopPropagation(); onMoveItem("up") }}
              disabled={isFirst}
              aria-label="위로"
              data-testid={`move-up-${index}`}
            >
              <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={(e) => { e.stopPropagation(); onMoveItem("down") }}
              disabled={isLast}
              aria-label="아래로"
              data-testid={`move-down-${index}`}
            >
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={(e) => { e.stopPropagation(); onMoveItem("bottom") }}
              disabled={isLast}
              aria-label="맨 아래로"
              data-testid={`move-bottom-${index}`}
            >
              <ChevronsDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* 삭제 버튼 — 순서 버튼 아래 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-8 h-6 w-6 rounded-full opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          aria-label={`${place.name} 삭제`}
          data-testid={`place-remove-${index}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-start gap-2.5 pl-5">
          {/* 카테고리 아이콘 */}
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <CategoryIcon className="h-5 w-5 text-muted-foreground" aria-label={categoryLabel} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-tight pr-6 truncate">{place.name}</h3>
            <p className="text-[11px] text-muted-foreground/70">{place.nameEn}</p>

            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {/* 시간대 표시/편집 */}
              {isEditingTime ? (
                <input
                  ref={timeInputRef}
                  type="time"
                  defaultValue={startTime ?? ""}
                  className="h-8 w-[100px] shrink-0 appearance-none rounded-lg bg-card px-2 text-xs font-medium text-foreground outline-none border border-sakura-dark shadow-sm focus:ring-2 focus:ring-sakura/30 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:leading-[30px]"
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
                  className="flex items-center gap-1 rounded-lg border border-sakura/30 bg-sakura/10 px-2.5 py-1 text-xs font-semibold text-sakura-dark dark:text-sakura hover:bg-sakura/20 transition-colors shadow-sm"
                  onClick={(e) => { e.stopPropagation(); setIsEditingTime(true) }}
                  data-testid={`time-badge-${index}`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {startTime || "시간 설정"}
                </button>
              )}

              {/* 시간대 레이블 */}
              {startTime && (() => {
                const slot = getTimeSlotLabel(startTime)
                return slot ? (
                  <span className={`text-[10px] font-semibold ${slot.color}`} data-testid={`time-slot-${index}`}>
                    {slot.label}
                  </span>
                ) : null
              })()}

              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
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
                className="mt-1 w-full resize-none rounded-lg border border-border bg-muted px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-sakura/40"
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
