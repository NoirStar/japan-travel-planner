import { useCallback, useEffect, useMemo, useState, memo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus, ExternalLink, Clock, X, Bookmark } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"

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

const TIER_Z_INDEX: Record<RatingTier, number> = { premium: 100, good: 50, normal: 20, basic: 10 }
const TIER_OPACITY: Record<RatingTier, number> = { premium: 1, good: 1, normal: 0.92, basic: 0.8 }

/** Teardrop pin SVG path (36×48 viewBox), tip at (18, 46) */
const PIN = "M18 46C15.5 39 4 28 4 17A14 14 0 1 1 32 17C32 28 20.5 39 18 46Z"

const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)

/** 카테고리 아이콘 SVG — 컬러 silhouette, 흰 원 위에 표시 */
function getCategoryIconSvg(category: string, cx: number, cy: number, scale: number, c: string): string {
  const t = `translate(${cx},${cy}) scale(${scale})`
  switch (category) {
    case "restaurant":
      return `<g transform="${t}"><path d="M-3,-5.5 v4 c0,1.1 0.9,1.6 1.5,1.6 v4.4" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M2.8,-5.5 c0,0 -1,3.5 -0.8,5 c0.15,1 0.8,1.2 1.3,0.8 l0.5,-0.5 v4.7" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`
    case "cafe":
      return `<g transform="${t}"><rect x="-3.2" y="-1.5" width="5.5" height="5" rx="0.8" fill="${c}" opacity="0.85"/><path d="M2.3,-0.5 h1.2 a1.5,1.5 0 0,1 0,3 h-1.2" stroke="${c}" stroke-width="1.3" fill="none" stroke-linecap="round"/><line x1="-3.8" y1="4" x2="3" y2="4" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/><path d="M-1.2,-3.5 c0,-1.2 1.2,-1.2 1.2,0" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.6"/></g>`
    case "attraction":
      return `<g transform="${t}"><rect x="-4.5" y="-1.5" width="9" height="6" rx="1.2" fill="${c}" opacity="0.85"/><path d="M-1.5,-1.5 l0.8,-2 h1.4 l0.8,2" fill="${c}"/><circle cx="0" cy="1.5" r="2" fill="white" opacity="0.9"/><circle cx="0" cy="1.5" r="1.2" fill="${c}" opacity="0.4"/><circle cx="3" cy="-0.2" r="0.6" fill="white" opacity="0.5"/></g>`
    case "shopping":
      return `<g transform="${t}"><rect x="-3.5" y="-1.5" width="7" height="6.5" rx="1" fill="${c}" opacity="0.85"/><path d="M-1.5,-1.5 v-1.5 a1.5,1.5 0 0,1 3,0 v1.5" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7"/></g>`
    case "accommodation":
      return `<g transform="${t}"><path d="M-2,-4 a4,4 0 0,0 0,7 a5.5,5.5 0 0,1 0,-7z" fill="${c}" opacity="0.85"/><ellipse cx="1" cy="3" rx="3.5" ry="1.2" fill="${c}" opacity="0.4"/><circle cx="2" cy="0.5" r="0.5" fill="${c}" opacity="0.3"/></g>`
    case "transport":
      return `<g transform="${t}"><rect x="-3.5" y="-4.5" width="7" height="7.5" rx="2.5" fill="${c}" opacity="0.85"/><rect x="-2.2" y="-3" width="4.4" height="2.5" rx="0.6" fill="white" opacity="0.3"/><circle cx="-1.5" cy="1.2" r="0.8" fill="white" opacity="0.35"/><circle cx="1.5" cy="1.2" r="0.8" fill="white" opacity="0.35"/></g>`
    default:
      return `<g transform="${t}"><circle cx="0" cy="-1" r="3" fill="${c}" opacity="0.85"/><circle cx="0" cy="-1" r="1.3" fill="white" opacity="0.3"/></g>`
  }
}

/**
 * Teardrop pin SVG data URI — 카테고리 색상 + 흰 원 + 아이콘
 * premium: 따뜻한 halo glow, selected: 링 강조
 */
function createTeardropPinSvg(category: string, rating: number | undefined, selected: boolean): string {
  const tier = getRatingTier(rating)
  const color = CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other
  const isPremium = tier === "premium"

  const shadowStd = isPremium ? 2.5 : tier === "good" ? 2 : 1.5
  const shadowOp = isPremium ? 0.18 : 0.12

  let selEls = ""
  if (selected) {
    selEls = `<path d="${PIN}" fill="none" stroke="${color}" stroke-width="5" opacity="0.15"/><path d="${PIN}" fill="none" stroke="${color}" stroke-width="2" opacity="0.45"/>`
  }

  let haloEl = ""
  if (isPremium && !selected) {
    haloEl = `<path d="${PIN}" fill="none" stroke="rgba(210,170,80,0.12)" stroke-width="4"/>`
  }

  const iconSvg = getCategoryIconSvg(category, 18, 17, 0.95, color)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
<defs><filter id="s"><feDropShadow dx="0" dy="1.5" stdDeviation="${shadowStd}" flood-opacity="${shadowOp}"/></filter></defs>
<g filter="url(#s)">
${haloEl}${selEls}
<path d="${PIN}" fill="${color}"/>
<circle cx="18" cy="17" r="10" fill="white"/>
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
 * Marker + SVG data URI 기반 teardrop pin.
 * 호버 → 미니 툴팁 (이름+별점)
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
  }, [marker, isSelected])

  const color = CATEGORY_COLOR[place.category] ?? CATEGORY_COLOR.other
  const tier = getRatingTier(place.rating)
  const iconUrl = useMemo(() => createTeardropPinSvg(place.category, place.rating, !!isSelected), [place.category, place.rating, isSelected])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

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
