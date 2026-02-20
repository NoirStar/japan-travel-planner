import { useEffect, useMemo } from "react"
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps"
import { useUIStore } from "@/stores/uiStore"
import type { MapCenter } from "@/types/map"
import type { Place } from "@/types/place"
import { MapPin } from "lucide-react"
import { PlaceMarker } from "./PlaceMarker"
import { CityPlaceMarker } from "./CityPlaceMarker"
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
  /** 일정에 추가된 장소 (번호 마커 + 경로) */
  places?: Place[]
  /** 도시의 모든 장소 (작은 마커로 표시) */
  allCityPlaces?: Place[]
  selectedPlaceId?: string | null
  onSelectPlace?: (placeId: string | null) => void
  /** 미추가 장소 클릭 시 일정에 추가하는 콜백 */
  onAddPlace?: (placeId: string) => void
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

export function MapView({ center, zoom, className = "", places = [], allCityPlaces = [], selectedPlaceId, onSelectPlace, onAddPlace }: MapViewProps) {
  const { isDarkMode } = useUIStore()
  const { apiKey, darkMapId, lightMapId } = getEnv()

  // 일정에 추가되지 않은 장소만 필터링
  const scheduledIds = useMemo(() => new Set(places.map((p) => p.id)), [places])
  const unscheduledPlaces = useMemo(
    () => allCityPlaces.filter((p) => !scheduledIds.has(p.id)),
    [allCityPlaces, scheduledIds],
  )

  // fitBounds 대상: 일정 장소가 있으면 일정 장소, 없으면 모든 도시 장소
  const fitPlaces = places.length > 0 ? places : allCityPlaces

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
          {/* 도시의 미추가 장소 — 작은 마커 */}
          {unscheduledPlaces.map((place) => (
            <CityPlaceMarker
              key={place.id}
              place={place}
              isSelected={selectedPlaceId === place.id}
              onSelect={() => onSelectPlace?.(place.id === selectedPlaceId ? null : place.id)}
              onAdd={() => onAddPlace?.(place.id)}
            />
          ))}

          {/* 일정 장소 — 번호 마커 */}
          {places.map((place, index) => (
            <PlaceMarker
              key={place.id}
              place={place}
              index={index}
              isSelected={selectedPlaceId === place.id}
              onSelect={() => onSelectPlace?.(place.id === selectedPlaceId ? null : place.id)}
            />
          ))}

          {/* 경로 폴리라인 */}
          <RoutePolyline places={places} />

          {/* 자동 fitBounds */}
          <FitBoundsHelper places={fitPlaces} />
        </Map>
      </APIProvider>
    </div>
  )
}
