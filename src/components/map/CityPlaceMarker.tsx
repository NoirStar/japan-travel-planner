import { useState, useCallback } from "react"
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"

/** 카테고리별 마커 색상 */
const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "bg-orange-500",
  attraction: "bg-pink-500",
  shopping: "bg-violet-500",
  accommodation: "bg-blue-500",
  cafe: "bg-amber-500",
  transport: "bg-emerald-500",
  other: "bg-gray-500",
}

interface CityPlaceMarkerProps {
  place: Place
  isSelected?: boolean
  onSelect?: () => void
  onAdd?: () => void
}

/**
 * 도시의 미추가 장소를 표시하는 작은 마커.
 * 클릭하면 InfoWindow에서 "일정 추가" 가능.
 */
export function CityPlaceMarker({ place, isSelected, onSelect, onAdd }: CityPlaceMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef()
  const [infoOpen, setInfoOpen] = useState(false)

  const handleClick = useCallback(() => {
    setInfoOpen((prev) => !prev)
    onSelect?.()
  }, [onSelect])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
  const colorClass = CATEGORY_COLORS[place.category] ?? "bg-gray-500"

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
      >
        <div
          className={`relative cursor-pointer transition-transform duration-200 ${isSelected ? "scale-125" : "hover:scale-110"}`}
          data-testid={`city-marker-${place.id}`}
        >
          {/* 작은 원형 카테고리 아이콘 마커 */}
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${colorClass} border-2 border-white shadow-md opacity-80 hover:opacity-100 transition-opacity ${
            isSelected ? "opacity-100 ring-2 ring-sakura/50" : ""
          }`}>
            <CategoryIcon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
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
              <CategoryIcon className="h-4 w-4 text-pink-500" />
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
                setInfoOpen(false)
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
