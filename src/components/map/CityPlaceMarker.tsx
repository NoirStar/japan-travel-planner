import { useCallback, useEffect, useMemo, useState, memo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus, ExternalLink, Clock, X, Bookmark } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"

/** 카테고리별 색상 Hex */
const CATEGORY_HEX: Record<string, string> = {
  restaurant: "#f97316",
  attraction: "#ec4899",
  shopping: "#8b5cf6",
  accommodation: "#3b82f6",
  cafe: "#f59e0b",
  transport: "#10b981",
  other: "#6b7280",
}

// ── 별점 등급 기반 마커 시스템 ─────────────────────────────
type RatingTier = "premium" | "good" | "normal" | "basic"

function getRatingTier(rating?: number): RatingTier {
  if (!rating) return "basic"
  if (rating >= 4.5) return "premium"
  if (rating >= 4.0) return "good"
  if (rating >= 3.5) return "normal"
  return "basic"
}

const TIER_Z_INDEX: Record<RatingTier, number> = { premium: 100, good: 50, normal: 20, basic: 10 }
const TIER_OPACITY: Record<RatingTier, number> = { premium: 1, good: 0.95, normal: 0.85, basic: 0.7 }

/** 카테고리 아이콘 SVG — Lucide 스타일 (검색패널과 동일한 느낌) */
function getCategoryIconSvg(category: string, cx: number, cy: number, scale: number): string {
  const t = `translate(${cx},${cy}) scale(${scale})`
  switch (category) {
    case "restaurant":
      // UtensilsCrossed — 교차된 포크+나이프
      return `<g transform="${t}"><path d="M-2,-5 v3.5 a1.2,1.2 0 0,0 2.4,0 v-3.5 M-0.8,-5 v3.5" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/><line x1="-0.8" y1="-1" x2="-0.8" y2="5" stroke="white" stroke-width="1.1" stroke-linecap="round"/><path d="M2.5,-5 l-0.3,4 c0,0.8 0.5,1.2 1.3,1 l0,-5 M2.2,-1 l0,6" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/></g>`
    case "cafe":
      // Coffee — 커피컵 + 손잡이 + 받침
      return `<g transform="${t}"><path d="M-3.5,-1 h6 l-0.5,5 h-5 z" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5,0 h1.5 a1,1 0 0,1 0,3 h-1.5" stroke="white" stroke-width="1.1" fill="none"/><line x1="-4" y1="4.5" x2="3" y2="4.5" stroke="white" stroke-width="1.2" stroke-linecap="round"/><path d="M-1.5,-3.5 c0,-1 1,-1 1,0 M0.5,-3.5 c0,-1 1,-1 1,0" stroke="white" stroke-width="0.8" fill="none" stroke-linecap="round"/></g>`
    case "attraction":
      // Landmark — 기둥이 있는 건물
      return `<g transform="${t}"><path d="M0,-4.5 l-4,2.5 h8 z" stroke="white" stroke-width="1.1" fill="none" stroke-linejoin="round"/><line x1="-2.5" y1="-1.5" x2="-2.5" y2="3" stroke="white" stroke-width="1.2" stroke-linecap="round"/><line x1="0" y1="-1.5" x2="0" y2="3" stroke="white" stroke-width="1.2" stroke-linecap="round"/><line x1="2.5" y1="-1.5" x2="2.5" y2="3" stroke="white" stroke-width="1.2" stroke-linecap="round"/><line x1="-4" y1="3.5" x2="4" y2="3.5" stroke="white" stroke-width="1.3" stroke-linecap="round"/></g>`
    case "shopping":
      // ShoppingBag — 쇼핑백 + 손잡이
      return `<g transform="${t}"><rect x="-3.5" y="-1" width="7" height="6" rx="0.8" stroke="white" stroke-width="1.2" fill="none"/><path d="M-1.5,-1 v-1.5 a1.5,1.5 0 0,1 3,0 v1.5" stroke="white" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`
    case "accommodation":
      // Hotel — 침대
      return `<g transform="${t}"><path d="M-4,3 v-7" stroke="white" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M-4,0 h6 a1.5,1.5 0 0,1 1.5,1.5 v1.5 h-9" stroke="white" stroke-width="1.2" fill="none" stroke-linejoin="round"/><circle cx="-2" cy="-2" r="1.3" fill="white" opacity="0.85"/><line x1="4" y1="3" x2="4" y2="1" stroke="white" stroke-width="1.2" stroke-linecap="round"/></g>`
    case "transport":
      // Train — 전철
      return `<g transform="${t}"><rect x="-3" y="-4" width="6" height="6.5" rx="1.5" stroke="white" stroke-width="1.2" fill="none"/><line x1="-3" y1="0" x2="3" y2="0" stroke="white" stroke-width="0.9"/><circle cx="-1.5" cy="1.3" r="0.7" fill="white"/><circle cx="1.5" cy="1.3" r="0.7" fill="white"/><line x1="-1.5" y1="3" x2="-2.5" y2="4.5" stroke="white" stroke-width="1" stroke-linecap="round"/><line x1="1.5" y1="3" x2="2.5" y2="4.5" stroke="white" stroke-width="1" stroke-linecap="round"/></g>`
    default:
      // MapPin
      return `<g transform="${t}"><circle cx="0" cy="-1" r="2.5" stroke="white" stroke-width="1.3" fill="none"/><path d="M0,1.5 l0,3" stroke="white" stroke-width="1.5" stroke-linecap="round"/></g>`
  }
}

/** 모던 티어드롭 핀 마커 SVG — 별점 등급별 크기 + 카테고리 아이콘 */
function createRatedPinSvg(color: string, category: string, rating: number | undefined, selected: boolean): string {
  const tier = getRatingTier(rating)

  const configs: Record<RatingTier, { w: number; h: number; r: number; iconScale: number }> = {
    premium: { w: 40, h: 50, r: 14, iconScale: 1.3 },
    good:    { w: 36, h: 46, r: 13, iconScale: 1.15 },
    normal:  { w: 32, h: 42, r: 11, iconScale: 1.0 },
    basic:   { w: 28, h: 38, r: 10, iconScale: 0.85 },
  }

  const c = configs[tier]
  const cx = c.w / 2
  const cy = c.r + 3
  const py = c.h - 3

  // 부드러운 티어드롭 베지어 경로
  const pin = `M ${cx} ${py} C ${cx - c.r * 0.3} ${py - (py - cy) * 0.3}, ${cx - c.r} ${cy + c.r * 0.65}, ${cx - c.r} ${cy} A ${c.r} ${c.r} 0 1 1 ${cx + c.r} ${cy} C ${cx + c.r} ${cy + c.r * 0.65}, ${cx + c.r * 0.3} ${py - (py - cy) * 0.3}, ${cx} ${py} Z`

  const borderColor = selected ? "#D96B60" : "#ffffff"
  const bw = selected ? 2.5 : 2

  const iconSvg = getCategoryIconSvg(category, cx, cy, c.iconScale)

  // 프리미엄: 은은한 골드 글로우
  const glow = tier === "premium"
    ? `<path d="${pin}" fill="none" stroke="#fbbf24" stroke-width="4" opacity="0.3"/>`
    : ""

  // 선택 시: primary 컬러 링
  const ring = selected
    ? `<path d="${pin}" fill="none" stroke="#D96B60" stroke-width="5" opacity="0.25"/>`
    : ""

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${c.w}" height="${c.h}" viewBox="0 0 ${c.w} ${c.h}">
<defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.15"/></filter></defs>
<g filter="url(#s)">
  ${ring}${glow}
  <path d="${pin}" fill="${color}" stroke="${borderColor}" stroke-width="${bw}"/>
</g>
${iconSvg}
</svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

interface CityPlaceMarkerProps {
  place: Place
  isSelected?: boolean
  onSelect?: () => void
  onAdd?: () => void
}

/**
 * 도시의 미추가 장소를 표시하는 핀 마커.
 * 호버 → 미니 툴팁 (사진+이름+별점)
 * 클릭 → 상세 InfoWindow + "일정에 추가"
 */
export const CityPlaceMarker = memo(function CityPlaceMarker({ place, isSelected, onSelect, onAdd }: CityPlaceMarkerProps) {
  const [markerRef, marker] = useMarkerRef()
  const [isHovered, setIsHovered] = useState(false)
  const activeTripId = useScheduleStore((s) => s.activeTripId)
  const isBookmarked = useScheduleStore((s) => activeTripId ? s.isInWishlist(activeTripId, place.id) : false)
  const addToWishlist = useScheduleStore((s) => s.addToWishlist)
  const removeFromWishlist = useScheduleStore((s) => s.removeFromWishlist)

  const handleClick = useCallback(() => {
    setIsHovered(false)
    onSelect?.()
  }, [onSelect])

  // 마커 hover 이벤트 리스너 (선택 상태 또는 모바일 터치 디바이스일 때는 무시)
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  useEffect(() => {
    if (!marker || isTouchDevice) return
    const over = marker.addListener("mouseover", () => {
      if (!isSelected) setIsHovered(true)
    })
    const out = marker.addListener("mouseout", () => setIsHovered(false))
    return () => {
      over.remove()
      out.remove()
    }
  }, [marker, isSelected, isTouchDevice])

  const color = CATEGORY_HEX[place.category] ?? "#6b7280"
  const tier = getRatingTier(place.rating)
  const iconUrl = useMemo(() => createRatedPinSvg(color, place.category, place.rating, !!isSelected), [color, place.category, place.rating, isSelected])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  // 호버 시 미니 툴팁 표시 (선택 상태가 아닐 때만)
  const showHoverTooltip = isHovered && !isSelected && marker

  return (
    <>
      <Marker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
        icon={iconUrl}
        zIndex={isSelected ? 500 : isHovered ? 300 : TIER_Z_INDEX[tier]}
        opacity={isSelected || isHovered ? 1 : TIER_OPACITY[tier]}
      />

      {/* 호버 툴팁 — 컴팩트 텍스트 */}
      {showHoverTooltip && (
        <InfoWindow
          anchor={marker}
          headerDisabled
          onCloseClick={() => setIsHovered(false)}
        >
          <div className="p-1.5 min-w-[140px] max-w-[220px] dark:bg-gray-800">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{place.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] rounded px-1 py-px" style={{ backgroundColor: `${color}20`, color }}>{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-600 dark:text-gray-300">
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
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
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
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
                <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5">{categoryLabel}</span>
                {place.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
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

              {/* 구글 지도에서 리뷰 보기 (Enterprise 등급 회피) */}
              {place.googleMapsUri && (
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
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
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
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
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
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
