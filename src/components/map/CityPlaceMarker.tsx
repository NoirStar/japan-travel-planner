import { useCallback, useEffect, useMemo, useState } from "react"
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

/** 핀 모양 SVG data URI 생성 (카테고리 색상 + 흰 내부 원) */
function createPinSvg(color: string, selected: boolean): string {
  if (selected) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
<defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter></defs>
<g filter="url(#s)">
  <path d="M14,2 C7,2 2,7 2,14 C2,22 14,37 14,37 C14,37 26,22 26,14 C26,7 21,2 14,2 Z" fill="${color}" stroke="#f472b6" stroke-width="2.5"/>
  <circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.9"/>
  <circle cx="14" cy="13" r="2.5" fill="${color}"/>
</g></svg>`)}`
  }
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
<defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/></filter></defs>
<g filter="url(#s)">
  <path d="M12,2 C6.5,2 2,6.5 2,12 C2,19 12,33 12,33 C12,33 22,19 22,12 C22,6.5 17.5,2 12,2 Z" fill="${color}" stroke="white" stroke-width="2"/>
  <circle cx="12" cy="11" r="4" fill="white" fill-opacity="0.9"/>
  <circle cx="12" cy="11" r="2" fill="${color}"/>
</g></svg>`)}`
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
export function CityPlaceMarker({ place, isSelected, onSelect, onAdd }: CityPlaceMarkerProps) {
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
  const iconUrl = useMemo(() => createPinSvg(color, !!isSelected), [color, isSelected])

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
        zIndex={isSelected ? 500 : isHovered ? 200 : 10}
        opacity={isSelected || isHovered ? 1 : 0.85}
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
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: color }}>
                <CategoryIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{place.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] rounded px-1 py-px" style={{ backgroundColor: `${color}20`, color }}>{categoryLabel}</span>
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

      {/* 클릭 시 상세 InfoWindow */}
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect?.()}
        >
          <div className="min-w-[200px] p-1.5">
            {place.image && (
              <div className="mb-2 h-24 w-full overflow-hidden rounded-lg">
                <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
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
