import { useCallback, useEffect, useMemo, useState } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star } from "lucide-react"
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

export function PlaceMarker({ place, index, isSelected, onSelect }: PlaceMarkerProps) {
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
          <div className="flex items-center gap-2 p-1 min-w-[160px]">
            {place.image ? (
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: colors[0] }}>
                <CategoryIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{place.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] rounded px-1 py-px" style={{ backgroundColor: `${colors[0]}20`, color: colors[0] }}>{categoryLabel}</span>
                {place.rating && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    {place.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* 선택 시 상세 InfoWindow */}
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[200px] p-1.5">
            {place.image && (
              <div className="mb-2 h-28 w-full overflow-hidden rounded-lg">
                <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <CategoryIcon className="h-4 w-4 text-sakura-dark" />
              <span className="text-sm font-bold text-gray-900">{place.name}</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{place.nameEn}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <span className="rounded bg-gray-100 px-1.5 py-0.5">{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {place.rating}
                </span>
              )}
            </div>
            {place.description && (
              <p className="mt-1.5 max-w-[220px] text-xs text-gray-500 line-clamp-2">
                {place.description}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  )
}
