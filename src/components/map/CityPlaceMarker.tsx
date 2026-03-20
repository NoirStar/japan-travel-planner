import { useCallback, useEffect, useMemo, useState, memo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus, ExternalLink, Clock, X, Bookmark } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"

/** 카테고리별 muted accent — 마커 하단 점/인포 칩에만 사용 */
const CATEGORY_ACCENT: Record<string, string> = {
  restaurant: "#B57A43",
  cafe: "#B57A43",
  attraction: "#7E628F",
  shopping: "#7E628F",
  accommodation: "#5C7B91",
  transport: "#5C7B91",
  other: "#8A8076",
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
const TIER_OPACITY: Record<RatingTier, number> = { premium: 1, good: 1, normal: 0.92, basic: 0.8 }

/** 카테고리 아이콘 SVG — neutral icon color (#2F667F) or white when selected */
function getCategoryIconSvg(category: string, cx: number, cy: number, scale: number, iconColor: string): string {
  const t = `translate(${cx},${cy}) scale(${scale})`
  const c = iconColor
  switch (category) {
    case "restaurant":
      return `<g transform="${t}"><path d="M-2,-5 v3.5 a1.2,1.2 0 0,0 2.4,0 v-3.5 M-0.8,-5 v3.5" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round"/><line x1="-0.8" y1="-1" x2="-0.8" y2="5" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/><path d="M2.5,-5 l-0.3,4 c0,0.8 0.5,1.2 1.3,1 l0,-5 M2.2,-1 l0,6" stroke="${c}" stroke-width="1" fill="none" stroke-linecap="round"/></g>`
    case "cafe":
      return `<g transform="${t}"><path d="M-3.5,-1 h6 l-0.5,5 h-5 z" stroke="${c}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5,0 h1.5 a1,1 0 0,1 0,3 h-1.5" stroke="${c}" stroke-width="1.1" fill="none"/><line x1="-4" y1="4.5" x2="3" y2="4.5" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><path d="M-1.5,-3.5 c0,-1 1,-1 1,0 M0.5,-3.5 c0,-1 1,-1 1,0" stroke="${c}" stroke-width="0.8" fill="none" stroke-linecap="round"/></g>`
    case "attraction":
      return `<g transform="${t}"><path d="M0,-4.5 l-4,2.5 h8 z" stroke="${c}" stroke-width="1.1" fill="none" stroke-linejoin="round"/><line x1="-2.5" y1="-1.5" x2="-2.5" y2="3" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><line x1="0" y1="-1.5" x2="0" y2="3" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><line x1="2.5" y1="-1.5" x2="2.5" y2="3" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><line x1="-4" y1="3.5" x2="4" y2="3.5" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/></g>`
    case "shopping":
      return `<g transform="${t}"><rect x="-3.5" y="-1" width="7" height="6" rx="0.8" stroke="${c}" stroke-width="1.2" fill="none"/><path d="M-1.5,-1 v-1.5 a1.5,1.5 0 0,1 3,0 v1.5" stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`
    case "accommodation":
      return `<g transform="${t}"><path d="M-4,3 v-7" stroke="${c}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M-4,0 h6 a1.5,1.5 0 0,1 1.5,1.5 v1.5 h-9" stroke="${c}" stroke-width="1.2" fill="none" stroke-linejoin="round"/><circle cx="-2" cy="-2" r="1.3" fill="${c}" opacity="0.7"/><line x1="4" y1="3" x2="4" y2="1" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/></g>`
    case "transport":
      return `<g transform="${t}"><rect x="-3" y="-4" width="6" height="6.5" rx="1.5" stroke="${c}" stroke-width="1.2" fill="none"/><line x1="-3" y1="0" x2="3" y2="0" stroke="${c}" stroke-width="0.9"/><circle cx="-1.5" cy="1.3" r="0.7" fill="${c}"/><circle cx="1.5" cy="1.3" r="0.7" fill="${c}"/><line x1="-1.5" y1="3" x2="-2.5" y2="4.5" stroke="${c}" stroke-width="1" stroke-linecap="round"/><line x1="1.5" y1="3" x2="2.5" y2="4.5" stroke="${c}" stroke-width="1" stroke-linecap="round"/></g>`
    default:
      return `<g transform="${t}"><circle cx="0" cy="-1" r="2.5" stroke="${c}" stroke-width="1.3" fill="none"/><path d="M0,1.5 l0,3" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/></g>`
  }
}

/**
 * 상용 여행 서비스 스타일 마커 — neutral 베이스 + muted category accent
 *
 * 기본: ivory fill (#FFFDF8) + dark stroke (#1F1B17) + teal icon (#2F667F)
 * 선택: coral fill (#D55A4D) + coral stroke + white icon + soft outer ring
 * tier 차이: 미세한 크기 + stroke 두께 + shadow 깊이 + premium inner ring
 */
function createRatedPinSvg(category: string, rating: number | undefined, selected: boolean): string {
  const tier = getRatingTier(rating)
  const accent = CATEGORY_ACCENT[category] ?? "#8A8076"

  // tier별 미세한 크기 차이만 허용
  const sizes: Record<RatingTier, { w: number; h: number; r: number; iconScale: number; sw: number; shadow: number }> = {
    premium: { w: 32, h: 42, r: 11.5, iconScale: 1.05, sw: 1.8, shadow: 2.2 },
    good:    { w: 30, h: 40, r: 11,   iconScale: 1.0,  sw: 1.6, shadow: 1.8 },
    normal:  { w: 28, h: 38, r: 10,   iconScale: 0.95, sw: 1.4, shadow: 1.4 },
    basic:   { w: 26, h: 36, r: 9.5,  iconScale: 0.9,  sw: 1.2, shadow: 1.0 },
  }

  const s = sizes[tier]
  const cx = s.w / 2
  const cy = s.r + 3
  const py = s.h - 2

  // 통일된 티어드롭 실루엣
  const pin = `M ${cx} ${py} C ${cx - s.r * 0.28} ${py - (py - cy) * 0.28}, ${cx - s.r} ${cy + s.r * 0.6}, ${cx - s.r} ${cy} A ${s.r} ${s.r} 0 1 1 ${cx + s.r} ${cy} C ${cx + s.r} ${cy + s.r * 0.6}, ${cx + s.r * 0.28} ${py - (py - cy) * 0.28}, ${cx} ${py} Z`

  // 선택 vs 기본 색상
  const fill = selected ? "#D55A4D" : "#FFFDF8"
  const stroke = selected ? "#D55A4D" : "#1F1B17"
  const iconColor = selected ? "#ffffff" : "#2F667F"

  const iconSvg = getCategoryIconSvg(category, cx, cy, s.iconScale, iconColor)

  // 선택 시: soft outer glow ring
  const outerRing = selected
    ? `<path d="${pin}" fill="none" stroke="rgba(213,90,77,0.18)" stroke-width="6"/>`
    : ""

  // premium만: champagne-toned inner ring (선택 시에는 보조적으로만)
  const innerRing = tier === "premium"
    ? `<path d="${pin}" fill="none" stroke="${selected ? "rgba(255,255,255,0.25)" : "rgba(198,172,128,0.3)"}" stroke-width="1" transform="translate(0,0)"/>`
    : ""

  // 카테고리 하단 점 — 작은 circle (선택 시 white)
  const dotColor = selected ? "rgba(255,255,255,0.7)" : accent
  const dotY = py - 4
  const categoryDot = `<circle cx="${cx}" cy="${dotY}" r="1.5" fill="${dotColor}"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}">
<defs><filter id="s"><feDropShadow dx="0" dy="0.8" stdDeviation="${s.shadow}" flood-opacity="0.12"/></filter></defs>
<g filter="url(#s)">
  ${outerRing}
  <path d="${pin}" fill="${fill}" stroke="${stroke}" stroke-width="${s.sw}"/>
  ${innerRing}
</g>
${iconSvg}
${categoryDot}
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

  const accent = CATEGORY_ACCENT[place.category] ?? "#8A8076"
  const tier = getRatingTier(place.rating)
  const iconUrl = useMemo(() => createRatedPinSvg(place.category, place.rating, !!isSelected), [place.category, place.rating, isSelected])

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
                <CategoryIcon className="h-4 w-4" style={{ color: accent }} />
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

              {/* 구글 지도에서 리뷰 보기 (Enterprise 등급 회피) */}
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
