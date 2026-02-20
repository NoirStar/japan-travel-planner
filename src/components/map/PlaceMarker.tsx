import { useState, useCallback } from "react"
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

/** 카테고리별 마커 색상 (Hex) */
const CATEGORY_HEX: Record<string, string> = {
  restaurant: "#f97316",
  attraction: "#ec4899",
  shopping: "#8b5cf6",
  accommodation: "#3b82f6",
  cafe: "#f59e0b",
  transport: "#10b981",
  other: "#6b7280",
}

export function PlaceMarker({ place, index, isSelected, onSelect }: PlaceMarkerProps) {
  const [markerRef, marker] = useMarkerRef()
  const [infoOpen, setInfoOpen] = useState(false)

  const handleClick = useCallback(() => {
    setInfoOpen((prev) => !prev)
    onSelect?.()
  }, [onSelect])

  const CategoryIcon = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category
  const color = CATEGORY_HEX[place.category] ?? "#6b7280"

  return (
    <>
      <Marker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
        label={{
          text: `${index + 1}`,
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "13px",
        }}
        icon={{
          path: 0, // google.maps.SymbolPath.CIRCLE
          fillColor: isSelected ? "#e11d48" : color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
          scale: 16,
          labelOrigin: { x: 0, y: 0 } as google.maps.Point,
        }}
        zIndex={isSelected ? 1000 : 100 + index}
      />

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="min-w-[180px] p-1">
            {/* 이미지 */}
            {place.image && (
              <div className="mb-2 h-24 w-full overflow-hidden rounded-lg">
                <img
                  src={place.image}
                  alt={place.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
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
