import { useCallback, useEffect, useMemo, useState, memo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Clock, ExternalLink } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"

interface PlaceMarkerProps {
  place: Place
  index: number
  isSelected?: boolean
  onSelect?: () => void
}

/** 카테고리별 색상 (from, to) */
const CATEGORY_COLORS: Record<string, [string, string]> = {
  restaurant: ["#f97316", "#ef4444"],
  attraction: ["#ec4899", "#f43f5e"],
  shopping: ["#8b5cf6", "#7c3aed"],
  accommodation: ["#3b82f6", "#4f46e5"],
  cafe: ["#f59e0b", "#d97706"],
  transport: ["#10b981", "#0d9488"],
  other: ["#6b7280", "#475569"],
}

/** SVG 말풍선 아이콘 (둥근 사각형 + V꼬리 + 번호) */
function createBalloonSvg(num: number, colors: [string, string], selected: boolean): string {
  const [c1, c2] = colors
  const border = selected ? "#f472b6" : "#ffffff"
  const bw = selected ? 3 : 2.5
  const glow = selected
    ? `<rect x="2" y="0" width="36" height="36" rx="11" ry="11" fill="none" stroke="#f472b680" stroke-width="5"/>`
    : ""

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>
  <filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.25"/></filter>
</defs>
<g filter="url(#s)">
  ${glow}
  <rect x="4" y="2" width="32" height="32" rx="10" ry="10" fill="url(#bg)" stroke="${border}" stroke-width="${bw}"/>
  <polygon points="14,33 20,44 26,33" fill="url(#bg)"/>
  <line x1="14" y1="33" x2="20" y2="44" stroke="${border}" stroke-width="${bw}" stroke-linecap="round"/>
  <line x1="26" y1="33" x2="20" y2="44" stroke="${border}" stroke-width="${bw}" stroke-linecap="round"/>
  <rect x="13" y="31" width="14" height="4" fill="url(#bg)"/>
</g>
<text x="20" y="23" text-anchor="middle" fill="white" font-size="15" font-weight="bold" font-family="Arial,sans-serif">${num}</text>
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const PlaceMarker = memo(function PlaceMarker({ place, index, isSelected, onSelect }: PlaceMarkerProps) {
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

  const colors = CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other
  const iconUrl = useMemo(() => createBalloonSvg(index + 1, colors, !!isSelected), [index, colors, isSelected])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  // 호버 시 미니 툴팁 (선택 상태가 아닐 때만)
  const showHoverTooltip = isHovered && !isSelected && marker

  return (
    <>
      <Marker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
        icon={iconUrl}
        zIndex={isSelected ? 1000 : isHovered ? 500 : 100 + index}
      />

      {/* 호버 툴팁 — 컴팩트 카드 */}
      {showHoverTooltip && (
        <InfoWindow
          anchor={marker}
          headerDisabled
          onCloseClick={() => setIsHovered(false)}
        >
          <div className="p-1.5 min-w-[140px] max-w-[220px]">
            <p className="text-xs font-bold text-gray-900 truncate">{place.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] rounded px-1 py-px" style={{ backgroundColor: `${colors[0]}20`, color: colors[0] }}>{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                  {place.rating}
                  {place.ratingCount && (
                    <span className="text-gray-400">({place.ratingCount.toLocaleString()})</span>
                  )}
                </span>
              )}
            </div>
            {place.description && (
              <p className="mt-1 text-[10px] text-gray-500 line-clamp-1 leading-relaxed">{place.description}</p>
            )}
          </div>
        </InfoWindow>
      )}

      {/* 선택 시 상세 InfoWindow */}
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[220px] max-w-[280px] p-1.5">
            {place.image && (
              <div className="mb-2 h-28 w-full overflow-hidden rounded-lg">
                <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <CategoryIcon className="h-4 w-4 text-sakura-dark" />
              <span className="text-sm font-bold text-gray-900">{place.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <span className="rounded bg-gray-100 px-1.5 py-0.5">{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {place.rating}
                  {place.ratingCount && (
                    <span className="text-gray-400 text-[10px]">({place.ratingCount.toLocaleString()})</span>
                  )}
                </span>
              )}
            </div>
            {place.address && (
              <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{place.address}</p>
            )}
            {place.description && (
              <p className="mt-1 max-w-[260px] text-xs text-gray-600 line-clamp-2">
                {place.description}
              </p>
            )}

            {/* 영업시간 */}
            {place.openingHours && place.openingHours.length > 0 && (
              <details className="mt-2 text-[10px] text-gray-500">
                <summary className="cursor-pointer flex items-center gap-1 font-medium text-gray-600">
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
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> 웹사이트
              </a>
            )}

            {/* 리뷰 */}
            {place.reviews && place.reviews.length > 0 && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-[11px] font-semibold text-gray-700 mb-1">리뷰</p>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {place.reviews.map((review, i) => (
                    <div key={i} className="text-[10px]">
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="font-medium">{review.authorName}</span>
                        <span className="flex items-center">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <Star key={j} className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                          ))}
                        </span>
                        <span className="text-gray-400">{review.relativeTime}</span>
                      </div>
                      {review.text && (
                        <p className="text-gray-500 line-clamp-3 mt-0.5">{review.text}</p>
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
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Google Maps에서 보기
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  )
})
