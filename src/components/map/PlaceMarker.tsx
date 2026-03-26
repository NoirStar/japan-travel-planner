import { useCallback, useEffect, useMemo, useState, memo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Clock, ExternalLink, Trash2, X } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"

interface PlaceMarkerProps {
  place: Place
  index: number
  isSelected?: boolean
  onSelect?: () => void
  onRemove?: () => void
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

/** 모던 티어드롭 핀 마커 — 번호 표시 (일정에 추가된 장소) */
function createBalloonSvg(num: number, colors: [string, string], selected: boolean): string {
  const [c1, c2] = colors
  const w = 36, h = 46, r = 13
  const cx = w / 2
  const cy = r + 3
  const py = h - 3

  const pin = `M ${cx} ${py} C ${cx - r * 0.3} ${py - (py - cy) * 0.3}, ${cx - r} ${cy + r * 0.65}, ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} C ${cx + r} ${cy + r * 0.65}, ${cx + r * 0.3} ${py - (py - cy) * 0.3}, ${cx} ${py} Z`

  const borderColor = selected ? "#D96B60" : "#ffffff"
  const bw = selected ? 2.5 : 2

  const ring = selected
    ? `<path d="${pin}" fill="none" stroke="#D96B60" stroke-width="5" opacity="0.25"/>`
    : ""

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>
  <filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.15"/></filter>
</defs>
<g filter="url(#s)">
  ${ring}
  <path d="${pin}" fill="url(#bg)" stroke="${borderColor}" stroke-width="${bw}"/>
</g>
<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="white" font-size="13" font-weight="700" font-family="system-ui,-apple-system,sans-serif">${num}</text>
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const PlaceMarker = memo(function PlaceMarker({ place, index, isSelected, onSelect, onRemove }: PlaceMarkerProps) {
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
            <p className="text-xs font-bold text-foreground truncate">{place.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] rounded px-1 py-px" style={{ backgroundColor: `${colors[0]}20`, color: colors[0] }}>{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Star className="h-2.5 w-2.5 fill-star text-star" />
                  {place.rating}
                  {place.ratingCount && (
                    <span className="text-muted-foreground/60">({place.ratingCount.toLocaleString()})</span>
                  )}
                </span>
              )}
            </div>
            {place.description && (
              <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">{place.description}</p>
            )}
          </div>
        </InfoWindow>
      )}

      {/* 선택 시 상세 InfoWindow */}
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          headerDisabled
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[220px] max-w-[280px] bg-elevated flex flex-col relative" style={{ maxHeight: '350px' }}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => onSelect?.()}
              className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1 overflow-y-auto p-1.5 min-h-0">
            {place.image && (
              <div className="mb-2 h-28 w-full overflow-hidden rounded-lg">
                <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <CategoryIcon className="h-4 w-4 text-cyan" />
              <span className="text-sm font-bold text-foreground">{place.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5">{categoryLabel}</span>
              {place.rating && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-star text-star" />
                  {place.rating}
                  {place.ratingCount && (
                    <span className="text-muted-foreground/60 text-[10px]">({place.ratingCount.toLocaleString()})</span>
                  )}
                </span>
              )}
            </div>
            {place.address && (
              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{place.address}</p>
            )}
            {place.description && (
              <p className="mt-1 max-w-[260px] text-xs text-muted-foreground line-clamp-2">
                {place.description}
              </p>
            )}

            {/* 영업시간 */}
            {place.openingHours && place.openingHours.length > 0 && (
              <details className="mt-2 text-[10px] text-muted-foreground">
                <summary className="cursor-pointer flex items-center gap-1 font-medium text-muted-foreground">
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
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo/5 px-2 py-1 text-[11px] text-indigo hover:underline"
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
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-indigo hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Google Maps에서 보기
              </a>
            )}
            </div>

            {/* 하단 고정 버튼 */}
            <div className="shrink-0 border-t border-border p-1.5">
              <Button
                size="sm"
                variant="destructive"
                className="w-full gap-1.5 rounded-lg text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove?.()
                  onSelect?.()
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                일정에서 삭제
              </Button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  )
})
