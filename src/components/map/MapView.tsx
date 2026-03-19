import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { APIProvider, Map, useMap, type MapMouseEvent } from "@vis.gl/react-google-maps"
import { useUIStore } from "@/stores/uiStore"
import type { MapCenter } from "@/types/map"
import type { Place } from "@/types/place"
import { MapPin, RotateCcw, Layers, TreePine, Bus, Building2, Moon, Sun } from "lucide-react"
import { PlaceMarker } from "./PlaceMarker"
import { CityPlaceMarker } from "./CityPlaceMarker"
import { RoutePolyline } from "./RoutePolyline"
import { UnifiedSearchBar, TextSearchBar } from "./SearchBar"

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
  /** 일정에서 장소 제거하는 콜백 */
  onRemovePlace?: (placeId: string) => void
  /** Google Maps 기본 POI 클릭 시 콜백 */
  onPoiClick?: (placeId: string) => void
  /** 현재 지도 영역에서 검색 */
  onSearchArea?: (lat: number, lng: number, radius: number) => void
  /** 검색 진행 중 여부 */
  isSearching?: boolean
  /** 검색 결과 메시지 (토스트) */
  searchMessage?: string | null
  /** 현재 활성 카테고리 필터 */
  activeCategory?: string
  /** 카테고리 변경 콜백 (지도 좌표/반경 포함) */
  onCategoryChange?: (category: string | undefined, lat: number, lng: number, radius: number) => void
  /** 최소 별점 필터 */
  minRating?: number
  /** 최소 별점 변경 콜백 */
  onMinRatingChange?: (rating: number | undefined) => void
  /** 마커 초기화 콜백 */
  onClearMarkers?: () => void
  /** 텍스트 검색 콜백 */
  onTextSearch?: (query: string) => void
  /** 텍스트 검색 진행 중 여부 */
  isTextSearching?: boolean
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

// ── 간소화된 지도 스타일 (POI/대중교통 등 시각 노이즈 감소) ──
// 비즈니스·도로 라벨 등은 항상 숨기고, 나머지는 토글 가능
const BASE_HIDDEN_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
]

// ── 다크모드 스타일 (Cloud Map ID 없을 때 CSS 폴백) ──
const DARK_MODE_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
]

// 토글별로 숨기는 스타일
const POI_STYLES: Record<string, google.maps.MapTypeStyle[]> = {
  attraction: [
    { featureType: "poi.attraction", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.place_of_worship", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.government", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.school", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.medical", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi.sports_complex", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
  park: [
    { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
  transit: [
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "transit.line", stylers: [{ visibility: "simplified" }] },
  ],
}

/** POI 토글 버튼 데이터 */
const POI_TOGGLES = [
  { id: "attraction", label: "관광명소", icon: Building2 },
  { id: "park", label: "공원", icon: TreePine },
  { id: "transit", label: "교통", icon: Bus },
] as const

function buildMapStyles(hiddenPois: Set<string>, isDark: boolean): google.maps.MapTypeStyle[] {
  const styles: google.maps.MapTypeStyle[] = isDark ? [...DARK_MODE_STYLES] : []
  styles.push(...BASE_HIDDEN_STYLES)
  for (const [key, poiStyles] of Object.entries(POI_STYLES)) {
    if (hiddenPois.has(key)) {
      styles.push(...poiStyles)
    }
  }
  return styles
}

/** 지도 설정 패널 — 우측 줌 버튼 아래에 초기화 + 레이어 토글 */
function MapControlPanel({
  hiddenPois,
  onTogglePoi,
  onClearMarkers,
  hasCityPlaces,
  isMapDark,
  onToggleMapDark,
}: {
  hiddenPois: Set<string>
  onTogglePoi: (poiId: string) => void
  onClearMarkers?: () => void
  hasCityPlaces: boolean
  isMapDark: boolean
  onToggleMapDark: () => void
}) {
  const [layerOpen, setLayerOpen] = useState(false)

  return (
    <div className="absolute top-28 right-3 z-10 flex flex-col items-end gap-2">
      {/* 지도 다크모드 토글 */}
      <button
        onClick={onToggleMapDark}
        className={`p-2.5 rounded-xl shadow-md border transition-all ${
          isMapDark
            ? "bg-slate-800 text-amber-300 border-slate-700"
            : "bg-background/90 backdrop-blur-sm text-foreground border-border/50 hover:bg-muted"
        }`}
        title={isMapDark ? "지도 밝게" : "지도 어둡게"}
      >
        {isMapDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      {/* 마커 초기화 버튼 */}
      {onClearMarkers && hasCityPlaces && (
        <button
          onClick={onClearMarkers}
          className="bg-background/90 backdrop-blur-sm text-foreground p-2.5 rounded-xl shadow-md border border-border/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="마커 초기화"
        >
          <RotateCcw className="w-4.5 h-4.5" />
        </button>
      )}

      {/* 레이어 토글 버튼 */}
      <button
        onClick={() => setLayerOpen(!layerOpen)}
        className={`p-2.5 rounded-xl shadow-md border transition-all ${
          layerOpen
            ? "bg-sakura-dark text-white border-sakura-dark"
            : "bg-background/90 backdrop-blur-sm text-foreground border-border/50 hover:bg-muted"
        }`}
        title="지도 레이어"
      >
        <Layers className="w-4.5 h-4.5" />
      </button>

      {/* 레이어 설정 드롭다운 */}
      {layerOpen && (
        <div className="w-40 rounded-2xl bg-card/95 backdrop-blur-sm shadow-xl border border-border py-2">
          <div className="px-3 py-1.5 text-caption text-muted-foreground font-medium border-b border-border/50">
            지도 표시 설정
          </div>
          {POI_TOGGLES.map((poi) => {
            const Icon = poi.icon
            const isVisible = !hiddenPois.has(poi.id)
            return (
              <button
                key={poi.id}
                onClick={() => onTogglePoi(poi.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all ${
                  isVisible ? "text-foreground" : "text-muted-foreground/50"
                } hover:bg-muted`}
              >
                <div className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${
                  isVisible ? "bg-sakura-dark border-sakura-dark" : "border-border bg-background"
                }`}>
                  {isVisible && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Icon className="w-3.5 h-3.5" />
                <span>{poi.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MapView({ center, zoom, className = "", places = [], allCityPlaces = [], activeDayIndex = 0, selectedPlaceId, onSelectPlace, onAddPlace, onRemovePlace, onPoiClick, onSearchArea, isSearching, searchMessage, activeCategory, onCategoryChange, minRating, onMinRatingChange, onClearMarkers, onTextSearch, isTextSearching }: MapViewProps) {
  const { isMapDarkMode, toggleMapDarkMode } = useUIStore()
  const { apiKey, darkMapId, lightMapId } = getEnv()
  const [mapError, setMapError] = useState(false)
  // POI 토글 상태 (숨긴 POI 카테고리 집합) — 기본: 모든 POI 표시
  const [hiddenPois, setHiddenPois] = useState<Set<string>>(() => new Set())

  const handleTogglePoi = useCallback((poiId: string) => {
    setHiddenPois((prev) => {
      const next = new Set(prev)
      if (next.has(poiId)) {
        next.delete(poiId)
      } else {
        next.add(poiId)
      }
      return next
    })
  }, [])

  const dynamicStyles = useMemo(() => buildMapStyles(hiddenPois, isMapDarkMode), [hiddenPois, isMapDarkMode])

  // Map 클릭 핸들러 — useCallback으로 안정적인 참조 유지 (불필요한 리렌더 방지)
  const handleMapClick = useCallback((e: MapMouseEvent) => {
    const placeId = (e.detail as { placeId?: string }).placeId
    if (placeId) {
      e.stop()
      onPoiClick?.(placeId)
    } else {
      onSelectPlace?.(null)
    }
  }, [onPoiClick, onSelectPlace])

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

  const mapId = isMapDarkMode ? darkMapId : lightMapId

  return (
    <div className={`h-full w-full relative ${className}`} data-testid="map-container">
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
          mapTypeControl={false}
          style={{ width: "100%", height: "100%" }}
          styles={mapId ? undefined : dynamicStyles}
          clickableIcons={true}
          onClick={handleMapClick}
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
              onRemove={() => onRemovePlace?.(place.id)}
            />
          ))}

          {/* 경로 폴리라인 */}
          <RoutePolyline places={places} dayIndex={activeDayIndex} />

          {/* 자동 fitBounds */}
          <FitBoundsHelper places={fitPlaces} />
        </Map>

        {/* ── Map 바깥 오버레이 (overflow 클리핑 방지) ── */}

        {/* 텍스트 검색바 (지도 상단) */}
        {onTextSearch && (
          <TextSearchBar onSearch={onTextSearch} isSearching={isTextSearching} />
        )}

        {/* 통합 검색바 (카테고리 + 별점 + 정렬 + 검색) */}
        {onSearchArea && onCategoryChange && onMinRatingChange && (
          <UnifiedSearchBar
            onSearch={onSearchArea}
            isSearching={isSearching}
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
            minRating={minRating}
            onMinRatingChange={onMinRatingChange}
          />
        )}

        {/* 검색 결과 토스트 메시지 */}
        {searchMessage && (
          <div className="absolute bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
            <div className="rounded-xl bg-card/95 backdrop-blur-sm px-4 py-2 text-xs font-medium text-foreground shadow-lg border border-border">
              {searchMessage}
            </div>
          </div>
        )}

        {/* 지도 설정 패널 (레이어 토글 + 마커 초기화) */}
        <MapControlPanel
          hiddenPois={hiddenPois}
          onTogglePoi={handleTogglePoi}
          onClearMarkers={onClearMarkers}
          hasCityPlaces={allCityPlaces.length > 0}
          isMapDark={isMapDarkMode}
          onToggleMapDark={toggleMapDarkMode}
        />
      </APIProvider>
    </div>
  )
}
