import { useEffect, useMemo, useState, useRef } from "react"
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps"
import { useUIStore } from "@/stores/uiStore"
import type { MapCenter } from "@/types/map"
import type { Place } from "@/types/place"
import { MapPin, Utensils, Hotel, ShoppingBag, Camera, Coffee, Star, RotateCcw, Search } from "lucide-react"
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
  /** 현재 활성 Day 인덱스 (경로 색상용) */
  activeDayIndex?: number
  selectedPlaceId?: string | null
  onSelectPlace?: (placeId: string | null) => void
  /** 미추가 장소 클릭 시 일정에 추가하는 콜백 */
  onAddPlace?: (placeId: string) => void
  /** Google Maps 기본 POI 클릭 시 콜백 */
  onPoiClick?: (placeId: string) => void
  /** 현재 지도 영역에서 검색 */
  onSearchArea?: (lat: number, lng: number) => void
  /** 현재 활성 카테고리 필터 */
  activeCategory?: string
  /** 카테고리 변경 콜백 */
  onCategoryChange?: (category: string | undefined) => void
  /** 최소 별점 필터 */
  minRating?: number
  /** 최소 별점 변경 콜백 */
  onMinRatingChange?: (rating: number | undefined) => void
  /** 마커 초기화 콜백 */
  onClearMarkers?: () => void
}

function MapFallback({ errorType }: { errorType?: "no-key" | "api-error" }) {
  const isApiError = errorType === "api-error"
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 bg-muted/20 text-muted-foreground bg-sakura-pattern"
      data-testid="map-fallback"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sakura/20 to-indigo/10">
        <MapPin className="h-8 w-8 text-sakura-dark opacity-60" />
      </div>
      <div className="text-center px-4">
        {isApiError ? (
          <>
            <p className="text-sm font-semibold">Google Maps를 로드할 수 없습니다</p>
            <p className="mt-1 max-w-sm text-xs opacity-60">
              API 키의 권한 또는 결제 설정을 확인해주세요
            </p>
            <div className="mt-3 space-y-1 text-left max-w-sm mx-auto">
              <p className="text-[11px] font-medium text-foreground/70">확인사항:</p>
              <ul className="text-[11px] space-y-0.5 list-disc pl-4 opacity-60">
                <li>Google Cloud Console → API 및 서비스 → <strong>Maps JavaScript API</strong> 사용 설정</li>
                <li>결제 계정이 프로젝트에 연결되어 있는지 확인</li>
                <li>API 키 제한사항에서 Maps JavaScript API가 허용되어 있는지 확인</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Google Maps API 키가 설정되지 않았습니다</p>
            <p className="mt-1 max-w-xs text-xs opacity-60">
              .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/** 일정 장소가 있으면 최초 1회만 fitBounds. 이후 절대 지도 이동하지 않음 */
function FitBoundsHelper({ places }: { places: Place[] }) {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (!map || places.length === 0 || hasFitted.current) return

    hasFitted.current = true

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

function SearchAreaButton({ onSearch }: { onSearch: (lat: number, lng: number) => void }) {
  const map = useMap()

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <button
        onClick={() => {
          if (!map) return
          const center = map.getCenter()
          if (center) {
            onSearch(center.lat(), center.lng())
          }
        }}
        className="bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full shadow-md text-sm font-medium border border-border/50 hover:bg-background transition-colors flex items-center gap-2"
      >
        <Search className="w-4 h-4" />
        현재 지도에서 검색
      </button>
    </div>
  )
}

// ── 카테고리 필터 버튼 ────────────────────────────
const CATEGORY_FILTERS = [
  { id: undefined, label: "전체", icon: MapPin },
  { id: "restaurant", label: "맛집", icon: Utensils },
  { id: "attraction", label: "관광지", icon: Camera },
  { id: "shopping", label: "쇼핑", icon: ShoppingBag },
  { id: "cafe", label: "카페", icon: Coffee },
  { id: "accommodation", label: "숙소", icon: Hotel },
] as const

function CategoryFilterBar({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory?: string
  onCategoryChange: (category: string | undefined) => void
}) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-lg border border-border/50">
      {CATEGORY_FILTERS.map((cat) => {
        const Icon = cat.icon
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id ?? "all"}
            onClick={() => onCategoryChange(cat.id as string | undefined)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive
                ? "bg-sakura text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

// ── 별점 필터 버튼 ────────────────────────────
const RATING_OPTIONS = [
  { value: undefined, label: "전체" },
  { value: 3.5, label: "3.5+" },
  { value: 4.0, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
] as const

function RatingFilterBar({
  minRating,
  onMinRatingChange,
}: {
  minRating?: number
  onMinRatingChange: (rating: number | undefined) => void
}) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-background/90 backdrop-blur-sm rounded-xl px-1.5 py-1.5 shadow-lg border border-border/50">
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        별점
      </div>
      {RATING_OPTIONS.map((opt) => {
        const isActive = minRating === opt.value
        return (
          <button
            key={opt.label}
            onClick={() => onMinRatingChange(opt.value as number | undefined)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? "bg-yellow-400 text-yellow-900 shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── 간소화된 지도 스타일 (POI/대중교통 등 시각 노이즈 감소) ──
const CLEAN_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit.line", stylers: [{ visibility: "simplified" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
]

export function MapView({ center, zoom, className = "", places = [], allCityPlaces = [], activeDayIndex = 0, selectedPlaceId, onSelectPlace, onAddPlace, onPoiClick, onSearchArea, activeCategory, onCategoryChange, minRating, onMinRatingChange, onClearMarkers }: MapViewProps) {
  const { isDarkMode } = useUIStore()
  const { apiKey, darkMapId, lightMapId } = getEnv()
  const [mapError, setMapError] = useState(false)

  // Google Maps 인증 실패 글로벌 콜백
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prev = (window as any).gm_authFailure as (() => void) | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gm_authFailure = () => {
      setMapError(true)
    }
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).gm_authFailure = prev
    }
  }, [])

  // 일정에 추가되지 않은 장소만 필터링
  const scheduledIds = useMemo(() => new Set(places.map((p) => p.id)), [places])
  const unscheduledPlaces = useMemo(
    () => allCityPlaces.filter((p) => !scheduledIds.has(p.id)),
    [allCityPlaces, scheduledIds],
  )

  // fitBounds 대상: 일정에 추가된 장소만 (검색 결과로 리셋하지 않음)
  const fitPlaces = places

  if (!apiKey) {
    return (
      <div className={`h-full w-full ${className}`}>
        <MapFallback errorType="no-key" />
      </div>
    )
  }

  if (mapError) {
    return (
      <div className={`h-full w-full ${className}`}>
        <MapFallback errorType="api-error" />
      </div>
    )
  }

  const mapId = isDarkMode ? darkMapId : lightMapId

  return (
    <div className={`h-full w-full ${className}`} data-testid="map-container">
      <APIProvider
        apiKey={apiKey}
        onLoad={() => setMapError(false)}
      >
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId={mapId || undefined}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
          styles={mapId ? undefined : CLEAN_MAP_STYLES}
          clickableIcons={true}
          onClick={(e) => {
            if (e.detail.placeId) {
              e.stop()
              onPoiClick?.(e.detail.placeId)
            } else {
              onSelectPlace?.(null)
            }
          }}
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
          <RoutePolyline places={places} dayIndex={activeDayIndex} />

          {/* 자동 fitBounds */}
          <FitBoundsHelper places={fitPlaces} />

          {/* 현재 지도에서 검색 버튼 */}
          {onSearchArea && <SearchAreaButton onSearch={onSearchArea} />}

          {/* 카테고리 필터 */}
          {onCategoryChange && (
            <CategoryFilterBar
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
          )}

          {/* 별점 필터 */}
          {onMinRatingChange && (
            <RatingFilterBar
              minRating={minRating}
              onMinRatingChange={onMinRatingChange}
            />
          )}

          {/* 마커 초기화 버튼 */}
          {onClearMarkers && allCityPlaces.length > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={onClearMarkers}
                className="bg-background/90 backdrop-blur-sm text-foreground p-2 rounded-full shadow-md border border-border/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="마커 초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </Map>
      </APIProvider>
    </div>
  )
}
