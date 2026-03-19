import { forwardRef, useState, useRef, useEffect } from "react"
import { X, Star, Clock, StickyNote, ChevronDown, ChevronUp, ArrowUp, ArrowDown, MoreVertical, Wallet } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { COST_CATEGORY_LABELS, type CostCategory } from "@/types/schedule"

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
  /** 비용 (엔화) */
  cost?: number
  /** 비용 카테고리 */
  costCategory?: CostCategory
  /** 비용 변경 콜백 */
  onCostChange?: (cost: number | undefined, category?: CostCategory) => void
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
    { place, index, totalItems = 1, onRemove, onMoveItem, startTime, memo, onStartTimeChange, onMemoChange, cost, costCategory, onCostChange, isSelected, onClick },
    ref,
  ) {
    const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
    const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
    const gradientClass = CATEGORY_GRADIENT[place.category] ?? "from-gray-400 to-slate-400"
    const [isEditingTime, setIsEditingTime] = useState(false)
    const [showMemo, setShowMemo] = useState(!!memo)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        className={`group relative rounded-2xl border bg-card p-3 transition-all duration-200 hover:shadow-md cursor-pointer ${
          isSelected
            ? "border-sakura-dark shadow-md"
            : "border-border hover:border-sakura/40"
        }`}
        data-testid={`place-card-${index}`}
        data-place-id={place.id}
        onClick={onClick}
      >
        {/* 좌측 컬러 스트라이프 */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b ${gradientClass}`} />

        {/* 번호 배지 */}
        <div
          className={`absolute -left-1 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} text-[10px] font-bold text-white shadow-md`}
        >
          {index + 1}
        </div>

        <div className="flex items-start gap-2.5 pl-5">
          {/* 카테고리 아이콘 — 데스크톱만 */}
          <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted lg:flex">
            <CategoryIcon className="h-5 w-5 text-muted-foreground" aria-label={categoryLabel} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold leading-tight truncate">{place.name}</h3>
            {/* 영문명 — 데스크톱만 */}
            <p className="hidden text-[11px] text-muted-foreground/70 lg:block">{place.nameEn}</p>

            <div className="mt-2 flex items-center gap-2 flex-wrap lg:mt-2">
              {/* 시간대 표시/편집 */}
              {isEditingTime ? (
                <input
                  ref={timeInputRef}
                  type="time"
                  defaultValue={startTime ?? ""}
                  className="h-9 w-[100px] shrink-0 appearance-none rounded-lg bg-card px-2.5 text-[13px] font-medium text-foreground outline-none border border-sakura-dark shadow-sm focus:ring-2 focus:ring-sakura/30 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:leading-[32px]"
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
                  className="flex items-center gap-1.5 rounded-lg border border-sakura/30 bg-sakura/10 px-2.5 py-1 text-caption font-semibold text-sakura-dark dark:text-sakura hover:bg-sakura/20 transition-colors shadow-sm lg:px-3 lg:py-1.5 lg:text-[13px]"
                  onClick={(e) => { e.stopPropagation(); setIsEditingTime(true) }}
                  data-testid={`time-badge-${index}`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {startTime || "시간"}
                </button>
              )}

              {/* 시간대 레이블 */}
              {startTime && (() => {
                const slot = getTimeSlotLabel(startTime)
                return slot ? (
                  <span className={`text-caption font-semibold ${slot.color}`} data-testid={`time-slot-${index}`}>
                    {slot.label}
                  </span>
                ) : null
              })()}

              <span className="chip chip-muted">
                {categoryLabel}
              </span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-caption text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {place.rating}
                </span>
              )}
            </div>

            {/* 메모 요약 — 모바일에서도 메모가 있으면 한 줄 표시 */}
            {memo && !showMemo && (
              <p className="mt-1.5 line-clamp-1 text-caption text-muted-foreground/70 lg:hidden">
                <StickyNote className="mr-1 inline h-3 w-3" />{memo}
              </p>
            )}

            {/* 설명 — 데스크톱만 */}
            {place.description && (
              <p className="mt-2 line-clamp-2 text-body-sm leading-relaxed text-muted-foreground/70 hidden lg:block">
                {place.description}
              </p>
            )}

            {/* 메모 토글 — 데스크톱만 */}
            <button
              className="mt-2 hidden items-center gap-1.5 text-caption text-muted-foreground/60 hover:text-muted-foreground transition-colors lg:flex"
              onClick={(e) => { e.stopPropagation(); setShowMemo(!showMemo) }}
              data-testid={`memo-toggle-${index}`}
            >
              <StickyNote className="h-3.5 w-3.5" />
              {memo ? "메모 보기" : "메모 추가"}
              {showMemo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {/* 메모 입력 — 데스크톱만 */}
            {showMemo && (
              <textarea
                className="mt-2 hidden w-full resize-none rounded-xl border border-border bg-muted px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-sakura/40 lg:block"
                placeholder="메모를 입력하세요..."
                rows={2}
                defaultValue={memo ?? ""}
                onBlur={(e) => onMemoChange?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                data-testid={`memo-input-${index}`}
              />
            )}

            {/* 비용 — 데스크톱만 */}
            {onCostChange && (
              <div className="mt-2 hidden items-center gap-2 text-caption lg:flex" onClick={(e) => e.stopPropagation()}>
                <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                <input
                  type="number"
                  className="w-20 rounded-lg border border-border bg-muted px-2 py-1 text-caption text-foreground outline-none focus:ring-1 focus:ring-sakura/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  placeholder="비용(¥)"
                  defaultValue={cost ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined
                    onCostChange(v, costCategory)
                  }}
                />
                <select
                  className="rounded-lg border border-border bg-muted px-2 py-1 text-caption text-foreground outline-none"
                  value={costCategory ?? ""}
                  onChange={(e) => {
                    const cat = e.target.value as CostCategory | ""
                    onCostChange(cost, cat || undefined)
                  }}
                >
                  <option value="">분류</option>
                  {Object.entries(COST_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 데스크톱: 순서 이동 · 삭제 버튼 */}
          <div className="hidden flex-col items-center gap-0.5 -my-0.5 shrink-0 lg:flex" data-testid={`reorder-buttons-${index}`}>
            {onMoveItem && totalItems > 1 && (
              <>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  onClick={(e) => { e.stopPropagation(); onMoveItem("up") }}
                  disabled={isFirst}
                  aria-label="위로"
                  data-testid={`move-up-${index}`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  onClick={(e) => { e.stopPropagation(); onMoveItem("down") }}
                  disabled={isLast}
                  aria-label="아래로"
                  data-testid={`move-down-${index}`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              aria-label={`${place.name} 삭제`}
              data-testid={`place-remove-${index}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* 모바일: ... 액션 메뉴 버튼 */}
          <div className="relative shrink-0 lg:hidden">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen) }}
              aria-label="더보기"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false) }} />
                <div className="absolute right-0 top-8 z-40 min-w-[120px] rounded-xl border border-border bg-card py-1 shadow-xl">
                  {onMoveItem && !isFirst && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                      onClick={(e) => { e.stopPropagation(); onMoveItem("up"); setMobileMenuOpen(false) }}
                    >
                      <ArrowUp className="h-3.5 w-3.5" /> 위로
                    </button>
                  )}
                  {onMoveItem && !isLast && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                      onClick={(e) => { e.stopPropagation(); onMoveItem("down"); setMobileMenuOpen(false) }}
                    >
                      <ArrowDown className="h-3.5 w-3.5" /> 아래로
                    </button>
                  )}
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMobileMenuOpen(false)
                      setShowMemo(!showMemo)
                    }}
                  >
                    <StickyNote className="h-3.5 w-3.5" /> {memo ? "메모 보기" : "메모 추가"}
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onRemove(); setMobileMenuOpen(false) }}
                  >
                    <X className="h-3.5 w-3.5" /> 삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 모바일 메모 영역 (메뉴에서 열었을 때) */}
        {showMemo && (
          <textarea
            className="mt-3 w-full resize-none rounded-xl border border-border bg-muted px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-sakura/40 lg:hidden"
            placeholder="메모를 입력하세요..."
            rows={2}
            defaultValue={memo ?? ""}
            onBlur={(e) => onMemoChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            data-testid={`memo-input-mobile-${index}`}
          />
        )}
      </div>
    )
  },
)
