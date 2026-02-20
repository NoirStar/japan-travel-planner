import { useCallback, useMemo } from "react"
import { Marker, InfoWindow, useMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus } from "lucide-react"
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

/** 카테고리 1글자 약어 */
const CATEGORY_ABBR: Record<string, string> = {
  restaurant: "食",
  attraction: "観",
  shopping: "買",
  accommodation: "泊",
  cafe: "茶",
  transport: "駅",
  other: "他",
}

/** 작은 원형 SVG 아이콘 (카테고리 색상 + 약어) */
function createSmallDotSvg(color: string, abbr: string, selected: boolean): string {
  const border = selected ? "#f472b6" : "#ffffff"
  const bw = selected ? 2.5 : 2
  const r = selected ? 12 : 10
  const w = (r + 4) * 2
  const cx = w / 2
  const tailH = 6

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w + tailH}" viewBox="0 0 ${w} ${w + tailH}">
<defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/></filter></defs>
<g filter="url(#s)">
  <circle cx="${cx}" cy="${cx}" r="${r}" fill="${color}" stroke="${border}" stroke-width="${bw}"/>
  <polygon points="${cx - 4},${cx + r - 2} ${cx},${w + tailH - 2} ${cx + 4},${cx + r - 2}" fill="${color}"/>
</g>
<text x="${cx}" y="${cx + 4}" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="Arial,sans-serif">${abbr}</text>
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
 * 도시의 미추가 장소를 표시하는 작은 원형 마커.
 * 클릭하면 InfoWindow에서 "일정 추가" 가능.
 */
export function CityPlaceMarker({ place, isSelected, onSelect, onAdd }: CityPlaceMarkerProps) {
  const [markerRef, marker] = useMarkerRef()

  const handleClick = useCallback(() => {
    onSelect?.()
  }, [onSelect])

  const color = CATEGORY_HEX[place.category] ?? "#6b7280"
  const abbr = CATEGORY_ABBR[place.category] ?? "他"
  const iconUrl = useMemo(() => createSmallDotSvg(color, abbr, !!isSelected), [color, abbr, isSelected])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  return (
    <>
      <Marker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
        icon={iconUrl}
        zIndex={isSelected ? 500 : 10}
        opacity={isSelected ? 1 : 0.85}
      />

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[200px] p-1.5">
            {/* 이미지 */}
            {place.image && (
              <div className="mb-2 h-24 w-full overflow-hidden rounded-lg">
                <img
                  src={place.image}
                  alt={place.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <CategoryIcon className="h-4 w-4" style={{ color }} />
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

            {/* 일정 추가 버튼 */}
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
}
