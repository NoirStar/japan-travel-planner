import { useCallback } from "react"
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps"
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

export function PlaceMarker({ place, index, isSelected, onSelect }: PlaceMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef()

  const handleClick = useCallback(() => {
    onSelect?.()
  }, [onSelect])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
  const gradient = CATEGORY_GRADIENT[place.category] ?? "from-gray-500 to-slate-600"

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
        zIndex={isSelected ? 1000 : 100 + index}
      >
        {/* 말풍선 마커 */}
        <div className="relative flex flex-col items-center">
          {/* 이름 + 별점 라벨 (말풍선 위) */}
          <div className={`mb-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md bg-gradient-to-r ${gradient} transition-all duration-200 ${
            isSelected ? "scale-110 shadow-lg" : ""
          }`}>
            <span className="max-w-[80px] truncate">{place.name}</span>
            {place.rating && (
              <>
                <Star className="h-2.5 w-2.5 flex-shrink-0 fill-yellow-300 text-yellow-300" />
                <span className="text-yellow-100">{place.rating}</span>
              </>
            )}
          </div>

          {/* 말풍선 본체 — 사진 + 번호 */}
          <div className={`relative overflow-visible rounded-xl border-[2.5px] shadow-lg transition-all duration-200 ${
            isSelected
              ? "border-sakura ring-2 ring-sakura/40 scale-110"
              : "border-white hover:scale-105 hover:shadow-xl"
          }`}>
            <div className="h-12 w-12 overflow-hidden rounded-[9px]">
              {place.image ? (
                <img
                  src={place.image}
                  alt={place.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                  <CategoryIcon className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {/* 번호 배지 */}
            <div className={`absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[10px] font-bold text-white shadow ring-[1.5px] ring-white`}>
              {index + 1}
            </div>
          </div>

          {/* 꼬리 (V 모양 포인터) */}
          <div className="relative -mt-[1px]">
            <svg width="14" height="8" viewBox="0 0 14 8" className="drop-shadow-sm">
              <polygon points="0,0 7,8 14,0" fill="white" />
            </svg>
          </div>
        </div>
      </AdvancedMarker>

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
