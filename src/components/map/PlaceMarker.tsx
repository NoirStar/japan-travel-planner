import { useState, useCallback } from "react"
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

export function PlaceMarker({ place, index, isSelected, onSelect }: PlaceMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef()
  const [infoOpen, setInfoOpen] = useState(false)

  const handleClick = useCallback(() => {
    setInfoOpen((prev) => !prev)
    onSelect?.()
  }, [onSelect])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
      >
        {/* 원형 사진 마커 */}
        <div
          className={`relative cursor-pointer transition-transform duration-200 ${isSelected ? "scale-125" : "hover:scale-110"}`}
          data-testid={`map-marker-${index}`}
        >
          <div className={`h-11 w-11 overflow-hidden rounded-full border-[2.5px] bg-gradient-to-br from-sakura-dark to-indigo shadow-lg ${
            isSelected ? "border-sakura ring-2 ring-sakura/50" : "border-white"
          }`}>
            {place.image ? (
              <img
                src={place.image}
                alt={place.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                {index + 1}
              </div>
            )}
          </div>

          {/* 번호 배지 (이미지가 있을 때만, 없으면 원 안에 번호 표시) */}
          {place.image && (
            <div className="absolute -left-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-sakura-dark to-indigo text-[9px] font-bold text-white shadow ring-1 ring-white">
              {index + 1}
            </div>
          )}

          {/* 별점 배지 */}
          {place.rating && (
            <div className="absolute -bottom-1 -right-1 flex items-center gap-[2px] rounded-full bg-white px-1 py-[1px] text-[9px] font-bold text-gray-800 shadow ring-1 ring-gray-200/60">
              <Star className="h-[10px] w-[10px] fill-amber-400 text-amber-400" />
              {place.rating}
            </div>
          )}
        </div>
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="min-w-[180px] p-1">
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
