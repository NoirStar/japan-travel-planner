import { useCallback, useState, memo } from "react"
import { InfoWindow } from "@vis.gl/react-google-maps"
import { Star, Plus, ExternalLink, Clock, X, Bookmark } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { CustomOverlay } from "./CustomOverlay"

/** 카테고리별 muted premium 마커 컬러 */
const CATEGORY_COLOR: Record<string, string> = {
  restaurant: "#D4766A",   // refined coral
  cafe: "#B89B7D",         // warm latte
  attraction: "#5B8DB8",   // clean blue
  shopping: "#C47A9B",     // elegant rose
  accommodation: "#5A9E8F", // calm teal
  transport: "#7088A0",    // slate/steel blue
  other: "#8E8578",        // neutral stone
}

// ── 별점 등급 기반 마커 시스템 ─────────────────────────────
type RatingTier = "premium" | "good" | "normal" | "basic"

export function getRatingTier(rating?: number): RatingTier {
  if (!rating) return "basic"
  if (rating >= 4.5) return "premium"
  if (rating >= 4.0) return "good"
  if (rating >= 3.5) return "normal"
  return "basic"
}

const TIER_Z: Record<RatingTier, number> = { premium: 100, good: 50, normal: 20, basic: 10 }
const TIER_OP: Record<RatingTier, number> = { premium: 1, good: 1, normal: 0.92, basic: 0.8 }

/** Teardrop pin SVG path (36×48 viewBox), tip at (18, 46) */
const PIN = "M18 46C15.5 39 4 28 4 17A14 14 0 1 1 32 17C32 28 20.5 39 18 46Z"

const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)

// ── Pin visual subcomponent ────────────────────────────────
interface PinVisualProps {
  color: string
  icon: React.ReactNode
  isPremium: boolean
  isSelected: boolean
  category: string
}

const PinVisual = memo(function PinVisual({ color, icon, isPremium, isSelected, category }: PinVisualProps) {
  const cls = [
    "city-pin",
    isPremium && "city-pin--premium",
    isSelected && "city-pin--selected",
  ].filter(Boolean).join(" ")

  return (
    <div
      className={cls}
      data-testid="city-pin-marker"
      data-category={category}
      data-premium={isPremium ? "true" : undefined}
    >
      <svg viewBox="0 0 36 48" width="36" height="48" fill="none">
        {isSelected && (
          <>
            <path d={PIN} stroke={color} strokeWidth="5" opacity="0.15" fill="none" />
            <path d={PIN} stroke={color} strokeWidth="2" opacity="0.35" fill="none" />
          </>
        )}
        <path d={PIN} fill={color} />
        <circle cx="18" cy="17" r="10" fill="white" />
      </svg>
      <div className="city-pin__icon">
        {icon}
      </div>
    </div>
  )
})

interface CityPlaceMarkerProps {
  place: Place
  isSelected?: boolean
  onSelect?: () => void
  onAdd?: () => void
}

/**
 * 도시의 미추가 장소를 표시하는 핀 마커.
 * CustomOverlay 기반 DOM 렌더링 + Lucide 아이콘.
 * 호버 → 미니 툴팁 (이름+별점)
 * 클릭 → 상세 InfoWindow + "일정에 추가"
 */
export const CityPlaceMarker = memo(function CityPlaceMarker({ place, isSelected, onSelect, onAdd }: CityPlaceMarkerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const activeTripId = useScheduleStore((s) => s.activeTripId)
  const isBookmarked = useScheduleStore((s) => activeTripId ? s.isInWishlist(activeTripId, place.id) : false)
  const addToWishlist = useScheduleStore((s) => s.addToWishlist)
  const removeFromWishlist = useScheduleStore((s) => s.removeFromWishlist)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsHovered(false)
    onSelect?.()
  }, [onSelect])

  const handleMouseEnter = useCallback(() => {
    if (!isSelected && !isTouchDevice) setIsHovered(true)
  }, [isSelected])

  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const color = CATEGORY_COLOR[place.category] ?? CATEGORY_COLOR.other
  const tier = getRatingTier(place.rating)
  const isPremium = tier === "premium"
  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  const zIndex = isSelected ? 500 : isHovered ? 300 : TIER_Z[tier]
  const opacity = isSelected || isHovered ? 1 : TIER_OP[tier]

  return (
    <>
      <CustomOverlay position={place.location} zIndex={zIndex}>
        <div
          style={{ opacity }}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <PinVisual
            color={color}
            icon={<CategoryIcon size={14} color={color} strokeWidth={2.2} />}
            isPremium={isPremium}
            isSelected={!!isSelected}
            category={place.category}
          />
        </div>
      </CustomOverlay>

      {/* 호버 툴팁 — 컴팩트 텍스트 */}
      {isHovered && !isSelected && (
        <InfoWindow
          position={place.location}
          headerDisabled
          onCloseClick={() => setIsHovered(false)}
        >
          <div className="p-1.5 min-w-[140px] max-w-[220px] dark:bg-gray-800">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{place.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] rounded px-1 py-px bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-600 dark:text-gray-300">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  {place.rating}
                  {place.ratingCount && (
                    <span className="text-gray-400 dark:text-gray-500">({place.ratingCount.toLocaleString()})</span>
                  )}
                </span>
              )}
            </div>
            {place.description && (
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 leading-relaxed">{place.description}</p>
            )}
          </div>
        </InfoWindow>
      )}

      {/* 클릭 시 상세 InfoWindow */}
      {isSelected && (
        <InfoWindow
          position={place.location}
          headerDisabled
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[220px] max-w-[280px] dark:bg-gray-800 flex flex-col relative" style={{ maxHeight: '350px' }}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => onSelect?.()}
              className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-1.5 min-h-0">
              {place.image && (
                <div className="mb-2 h-24 w-full overflow-hidden rounded-lg">
                  <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <CategoryIcon className="h-4 w-4" style={{ color }} />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{place.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="rounded bg-stone-100 dark:bg-gray-700 px-1.5 py-0.5 text-stone-600 dark:text-gray-300">{categoryLabel}</span>
                {place.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {place.rating}
                    {place.ratingCount && (
                      <span className="text-gray-400 dark:text-gray-500 text-[10px]">({place.ratingCount.toLocaleString()})</span>
                    )}
                  </span>
                )}
              </div>
              {place.address && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{place.address}</p>
              )}
              {place.description && (
                <p className="mt-1 max-w-[260px] text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {place.description}
                </p>
              )}

              {/* 영업시간 */}
              {place.openingHours && place.openingHours.length > 0 && (
                <details className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                  <summary className="cursor-pointer flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                    <Clock className="h-3 w-3" /> 영업시간
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {place.openingHours.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </details>
              )}

              {/* 구글 지도에서 리뷰 보기 */}
              {place.googleMapsUri && (
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-stone-50 dark:bg-stone-800/40 px-2 py-1 text-[11px] text-stone-600 dark:text-stone-400 hover:underline"
                >
                  <Star className="h-3 w-3" /> 구글 지도에서 리뷰 보기
                </a>
              )}

              {/* Google Maps 링크 */}
              {place.googlePlaceId && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.googlePlaceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Google Maps에서 보기
                </a>
              )}
            </div>

            {/* 하단 고정 버튼 */}
            <div className="shrink-0 border-t border-gray-100 dark:border-gray-700 p-1.5 flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 rounded-lg text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!activeTripId) return
                  if (isBookmarked) {
                    removeFromWishlist(activeTripId, place.id)
                  } else {
                    if (place.id.startsWith("google-")) {
                      useDynamicPlaceStore.getState().addPlace(place)
                    }
                    addToWishlist(activeTripId, place.id)
                  }
                }}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd?.()
                  onSelect?.()
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                일정에 추가
              </Button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  )
})
