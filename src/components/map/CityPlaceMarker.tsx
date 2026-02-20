import { useCallback } from "react"
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps"
import { Star, Plus } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"
import { CATEGORY_ICONS } from "@/lib/categoryIcons"
import { Button } from "@/components/ui/button"

/** 카테고리별 배경 그래디언트 */
const CATEGORY_GRADIENT: Record<string, string> = {
  restaurant: "from-orange-500 to-red-500",
  attraction: "from-pink-500 to-rose-500",
  shopping: "from-violet-500 to-purple-600",
  accommodation: "from-blue-500 to-indigo-500",
  cafe: "from-amber-500 to-yellow-600",
  transport: "from-emerald-500 to-teal-600",
  other: "from-gray-500 to-slate-600",
}

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

interface CityPlaceMarkerProps {
  place: Place
  isSelected?: boolean
  onSelect?: () => void
  onAdd?: () => void
}

/**
 * 도시의 미추가 장소를 표시하는 작은 말풍선 마커.
 * 클릭하면 InfoWindow에서 "일정 추가" 가능.
 */
export function CityPlaceMarker({ place, isSelected, onSelect, onAdd }: CityPlaceMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef()

  const handleClick = useCallback(() => {
    onSelect?.()
  }, [onSelect])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
  const gradient = CATEGORY_GRADIENT[place.category] ?? "from-gray-500 to-slate-600"
  const color = CATEGORY_HEX[place.category] ?? "#6b7280"

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
        zIndex={isSelected ? 500 : 10}
      >
        {/* 작은 말풍선 마커 */}
        <div className={`relative flex flex-col items-center transition-all duration-200 ${
          isSelected ? "scale-110" : "opacity-75 hover:opacity-100 hover:scale-105"
        }`}>
          {/* 카테고리 아이콘 원형 */}
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} border-2 border-white shadow-md`}>
            <CategoryIcon className="h-4 w-4 text-white" />
          </div>
          {/* 꼬리 */}
          <svg width="10" height="6" viewBox="0 0 10 6" className="-mt-[1px] drop-shadow-sm">
            <polygon points="0,0 5,6 10,0" fill="white" />
          </svg>
        </div>
      </AdvancedMarker>

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
                // 추가 후 닫기
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
