import { useEffect } from "react"
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps"
import { useUIStore } from "@/stores/uiStore"
import type { MapCenter } from "@/types/map"
import type { Place } from "@/types/place"
import { MapPin } from "lucide-react"
import { PlaceMarker } from "./PlaceMarker"
import { RoutePolyline } from "./RoutePolyline"

function getEnv() {
  return {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    darkMapId: import.meta.env.VITE_GOOGLE_MAPS_DARK_MAP_ID as string,
    lightMapId: import.meta.env.VITE_GOOGLE_MAPS_LIGHT_MAP_ID as string,
  }
}

interface MapViewProps {
  center: MapCenter
  zoom: number
  className?: string
  places?: Place[]
}

function MapFallback() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 bg-muted/20 text-muted-foreground bg-sakura-pattern"
      data-testid="map-fallback"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sakura/20 to-indigo/10">
        <MapPin className="h-8 w-8 text-sakura-dark opacity-60" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">Google Maps API 키가 설정되지 않았습니다</p>
        <p className="mt-1 max-w-xs text-xs opacity-60">
          .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요
        </p>
      </div>
    </div>
  )
}

/** 장소가 있으면 모두 보이도록 지도 영역 조정 */
function FitBoundsHelper({ places }: { places: Place[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || places.length === 0) return

    if (places.length === 1) {
      map.panTo(places[0].location)
      map.setZoom(15)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    for (const p of places) {
      bounds.extend(p.location)
    }
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
  }, [map, places])

  return null
}

export function MapView({ center, zoom, className = "", places = [] }: MapViewProps) {
  const { isDarkMode } = useUIStore()
  const { apiKey, darkMapId, lightMapId } = getEnv()

  if (!apiKey) {
    return (
      <div className={`h-full w-full ${className}`}>
        <MapFallback />
      </div>
    )
  }

  const mapId = isDarkMode ? darkMapId : lightMapId

  return (
    <div className={`h-full w-full ${className}`} data-testid="map-container">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId={mapId || undefined}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          {/* 장소 마커 */}
          {places.map((place, index) => (
            <PlaceMarker key={place.id} place={place} index={index} />
          ))}

          {/* 경로 폴리라인 */}
          <RoutePolyline places={places} />

          {/* 자동 fitBounds */}
          <FitBoundsHelper places={places} />
        </Map>
      </APIProvider>
    </div>
  )
}
