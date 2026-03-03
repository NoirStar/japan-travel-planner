import { useCallback, useEffect, useMemo, useState, memo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus, ExternalLink, Clock } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"

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

/** 카테고리 아이콘 SVG (중심점 기준 상대좌표) */
function getCategoryIconSvg(category: string, cx: number, cy: number, scale: number): string {
  const t = `translate(${cx},${cy}) scale(${scale})`
  switch (category) {
    case "restaurant":
      // 포크 + 나이프 아이콘
      return `<g transform="${t}"><path d="M-3.5,-4 v3 a1.5,1.5 0 0,0 3,0 v-3" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/><line x1="-2" y1="-1" x2="-2" y2="4" stroke="white" stroke-width="1.3" stroke-linecap="round"/><path d="M1.5,-4 v2.5 c0,1.5 1,2 2.5,1.5 v-4 M1.5,-1.5 l0,5.5" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`
    case "cafe":
      return `<g transform="${t}"><path d="M-3,-1.5 h5 l-0.5,4.5 h-4 z M2,0 h1.5 v2 h-1.5" stroke="white" stroke-width="1.3" fill="none" stroke-linecap="round"/><line x1="-3" y1="3.5" x2="2" y2="3.5" stroke="white" stroke-width="1.3" stroke-linecap="round"/></g>`
    case "attraction":
      return `<g transform="${t}"><path d="M0,-4 L1.2,-1.3 L4,-1.2 L2,0.8 L2.5,3.5 L0,2 L-2.5,3.5 L-2,0.8 L-4,-1.2 L-1.2,-1.3 Z" fill="white" opacity="0.95"/></g>`
    case "shopping":
      return `<g transform="${t}"><path d="M-3,0 h6 l0.5,4.5 h-7 z M-1,0 v-2 a1.5,1.5 0 0,1 3,0 v2" stroke="white" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>`
    case "accommodation":
      return `<g transform="${t}"><path d="M-4,3 v-5.5 h8 v5.5 M-4,0 h8" stroke="white" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="-1.5" cy="-2" r="1.2" fill="white" opacity="0.9"/></g>`
    case "transport":
      return `<g transform="${t}"><rect x="-3" y="-4" width="6" height="7" rx="1.5" stroke="white" stroke-width="1.3" fill="none"/><line x1="-3" y1="1" x2="3" y2="1" stroke="white" stroke-width="1"/><circle cx="-1.5" cy="2" r="0.7" fill="white"/><circle cx="1.5" cy="2" r="0.7" fill="white"/></g>`
    default:
      return `<g transform="${t}"><circle cx="0" cy="-1" r="2.5" stroke="white" stroke-width="1.3" fill="none"/><line x1="0" y1="2" x2="0" y2="4.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></g>`
  }
}

/** 별점 등급 + 카테고리 아이콘이 포함된 마커 SVG */
function createRatedPinSvg(color: string, category: string, rating: number | undefined, selected: boolean): string {
  const tier = getRatingTier(rating)

  const configs: Record<RatingTier, { w: number; bodyH: number; r: number; sw: number; tailH: number; iconScale: number }> = {
    premium: { w: 38, bodyH: 30, r: 10, sw: 2.5, tailH: 10, iconScale: 1.35 },
    good:    { w: 32, bodyH: 26, r: 8,  sw: 2,   tailH: 8,  iconScale: 1.15 },
    normal:  { w: 28, bodyH: 24, r: 7,  sw: 1.8, tailH: 7,  iconScale: 1.0 },
    basic:   { w: 24, bodyH: 20, r: 6,  sw: 1.5, tailH: 6,  iconScale: 0.85 },
  }

  const c = configs[tier]
  const totalH = c.bodyH + c.tailH + 2
  const cx = c.w / 2
  const bodyCy = c.bodyH / 2 + 1

  const border = selected ? "#f472b6" : "white"
  const bw = selected ? c.sw + 0.5 : c.sw

  const iconSvg = getCategoryIconSvg(category, cx, bodyCy, c.iconScale)

  // 프리미엄: 골드 테두리 글로우
  const premiumRing = tier === "premium"
    ? `<rect x="0.5" y="0.5" width="${c.w - 1}" height="${c.bodyH + 1}" rx="${c.r + 1}" fill="none" stroke="#fbbf24" stroke-width="3" opacity="0.5"/>`
    : ""

  // 프리미엄: 우상단 골드 별 뱃지
  const starBadge = tier === "premium"
    ? `<circle cx="${c.w - 5}" cy="5" r="5.5" fill="#fbbf24" stroke="white" stroke-width="1.5"/><text x="${c.w - 5}" y="7.5" text-anchor="middle" fill="white" font-size="7" font-weight="bold">★</text>`
    : ""

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${c.w}" height="${totalH}" viewBox="0 0 ${c.w} ${totalH}">
<defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.25"/></filter></defs>
<g filter="url(#s)">
  ${premiumRing}
  <rect x="2" y="2" width="${c.w - 4}" height="${c.bodyH - 2}" rx="${c.r}" fill="${color}" stroke="${border}" stroke-width="${bw}"/>
  <polygon points="${cx - 4},${c.bodyH - 1} ${cx},${c.bodyH + c.tailH - 2} ${cx + 4},${c.bodyH - 1}" fill="${color}"/>
  <line x1="${cx - 4}" y1="${c.bodyH - 1}" x2="${cx}" y2="${c.bodyH + c.tailH - 2}" stroke="${border}" stroke-width="${bw}" stroke-linecap="round"/>
  <line x1="${cx + 4}" y1="${c.bodyH - 1}" x2="${cx}" y2="${c.bodyH + c.tailH - 2}" stroke="${border}" stroke-width="${bw}" stroke-linecap="round"/>
  <rect x="${cx - 5}" y="${c.bodyH - 2.5}" width="10" height="3.5" fill="${color}"/>
</g>
${iconSvg}
${starBadge}
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

  const handleClick = useCallback(() => {
    setIsHovered(false)
    onSelect?.()
  }, [onSelect])

  // 마커 hover 이벤트 리스너 (선택 상태일 때는 무시)
  useEffect(() => {
    if (!marker) return
    const over = marker.addListener("mouseover", () => {
      if (!isSelected) setIsHovered(true)
    })
    const out = marker.addListener("mouseout", () => setIsHovered(false))
    return () => {
      over.remove()
      out.remove()
    }
  }, [marker, isSelected])

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
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[220px] max-w-[280px] p-1.5 dark:bg-gray-800">
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

            {/* 웹사이트 */}
            {place.websiteUri && (
              <a
                href={place.websiteUri}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> 웹사이트
              </a>
            )}

            {/* 리뷰 */}
            {place.reviews && place.reviews.length > 0 && (
              <div className="mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">리뷰 ({place.reviews.length})</p>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {place.reviews.map((review, i) => (
                    <div key={i} className="text-[10px]">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{review.authorName}</span>
                        <span className="flex items-center">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <Star key={j} className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                          ))}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">{review.relativeTime}</span>
                      </div>
                      {review.text && (
                        <p className="text-gray-500 dark:text-gray-400 line-clamp-3 mt-0.5">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Maps 링크 */}
            {place.googlePlaceId && (
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${place.googlePlaceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Google Maps에서 보기
              </a>
            )}

            <Button
              size="sm"
              className="mt-2 w-full gap-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 text-xs h-7"
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
        </InfoWindow>
      )}
    </>
  )
})
