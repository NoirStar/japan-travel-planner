import { useState, useCallback } from "react"
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps"
import { Star } from "lucide-react"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS } from "@/types/place"

interface PlaceMarkerProps {
  place: Place
  index: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍜",
  attraction: "🏯",
  shopping: "🛍️",
  accommodation: "🏨",
  cafe: "☕",
  transport: "🚃",
  other: "📍",
}

export function PlaceMarker({ place, index }: PlaceMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef()
  const [infoOpen, setInfoOpen] = useState(false)

  const handleClick = useCallback(() => {
    setInfoOpen((prev) => !prev)
  }, [])

  const emoji = CATEGORY_EMOJI[place.category] ?? "📍"
  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        onClick={handleClick}
        title={place.name}
      >
        {/* 커스텀 번호 마커 */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg ring-2 ring-white"
          data-testid={`map-marker-${index}`}
        >
          {index + 1}
        </div>
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="min-w-[180px] p-1">
            <div className="flex items-center gap-1.5">
              <span>{emoji}</span>
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
