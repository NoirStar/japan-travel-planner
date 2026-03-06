import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { APIProvider, Map, useMap, type MapMouseEvent } from "@vis.gl/react-google-maps"
import { useUIStore } from "@/stores/uiStore"
import type { MapCenter } from "@/types/map"
import type { Place } from "@/types/place"
import { MapPin, Utensils, Hotel, ShoppingBag, Camera, Coffee, Star, RotateCcw, Search, Loader2, ArrowUpDown, X, Layers, TreePine, Bus, Building2 } from "lucide-react"
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
  /** 현재 정렬 기준 */
  sortBy?: string
  /** 정렬 변경 콜백 */
  onSortChange?: (sort: string) => void
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

const TUTORIAL_KEY = "tabitalk-search-tutorial-seen"

// ── 카테고리 필터 ────────────────────────────
const CATEGORY_FILTERS = [
  { id: undefined, label: "전체", icon: MapPin },
  { id: "attraction", label: "관광지", icon: Camera },
  { id: "restaurant", label: "맛집", icon: Utensils },
  { id: "shopping", label: "쇼핑", icon: ShoppingBag },
  { id: "cafe", label: "카페", icon: Coffee },
  { id: "accommodation", label: "숙소", icon: Hotel },
] as const

// ── Google 별점 드롭다운 옵션 (내림차순) ────────────────────
const RATING_OPTIONS = [
  { value: 4.5, label: "4.5점 이상" },
  { value: 4.0, label: "4.0점 이상" },
  { value: 3.5, label: "3.5점 이상" },
  { value: 3.0, label: "3.0점 이상" },
  { value: 2.0, label: "2.0점 이상" },
  { value: 1.0, label: "1.0점 이상" },
  { value: undefined, label: "전체 (필터 해제)" },
] as const

// ── 정렬 옵션 ──────────────────────────────────────
const SORT_OPTIONS = [
  { value: "popularity", label: "인기순" },
  { value: "rating-desc", label: "별점 높은순" },
  { value: "rating-asc", label: "별점 낮은순" },
  { value: "reviews-desc", label: "리뷰 많은순" },
  { value: "name-asc", label: "이름순" },
] as const

/** 통합 검색바: 카테고리 필터 + Google 별점 드롭다운 + 정렬 + 검색 버튼 */
function UnifiedSearchBar({
  onSearch,
  isSearching,
  activeCategory,
  onCategoryChange,
  minRating,
  onMinRatingChange,
  sortBy,
  onSortChange,
}: {
  onSearch: (lat: number, lng: number, radius: number) => void
  isSearching?: boolean
  activeCategory?: string
  onCategoryChange: (category: string | undefined, lat: number, lng: number, radius: number) => void
  minRating?: number
  onMinRatingChange: (rating: number | undefined) => void
  sortBy?: string
  onSortChange?: (sort: string) => void
}) {
  const map = useMap()
  const [hasClicked, setHasClicked] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(() => {
    try { return !localStorage.getItem(TUTORIAL_KEY) } catch { return true }
  })

  useEffect(() => {
    if (!showTooltip) return
    const timer = setTimeout(() => {
      setShowTooltip(false)
      try { localStorage.setItem(TUTORIAL_KEY, "1") } catch { /* noop */ }
    }, 6000)
    return () => clearTimeout(timer)
  }, [showTooltip])

  useEffect(() => {
    if (!isSearching && hasClicked) {
      const t = setTimeout(() => setHasClicked(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isSearching, hasClicked])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!ratingOpen && !sortOpen) return
    const handler = (e: MouseEvent) => {
      if (ratingOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRatingOpen(false)
      }
      if (sortOpen && sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [ratingOpen, sortOpen])

  return (
    <div className="absolute bottom-3 left-2 right-2 sm:bottom-6 sm:left-3 sm:right-3 z-10 flex flex-col items-center pointer-events-none">
      {/* 튜토리얼 툴팁 */}
      {showTooltip && !hasClicked && !isSearching && (
        <div className="relative mb-2 rounded-2xl bg-sakura-dark px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-xl animate-bounce pointer-events-auto">
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            지도를 이동 후 검색 버튼을 눌러주세요!
          </span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-sakura-dark" />
        </div>
      )}

      {/* 통합 검색바 */}
      <div className="pointer-events-auto flex flex-col items-center gap-1 sm:gap-1.5 max-w-full">
        {/* 상단: 카테고리 필터 */}
        <div className="flex items-center gap-0.5 rounded-2xl bg-card/95 backdrop-blur-sm px-1 sm:px-1.5 py-1 sm:py-1.5 shadow-lg border border-border overflow-x-auto scrollbar-hide">
          {/* 카테고리 필터 */}
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id ?? "all"}
              onClick={() => {
                if (!map) return
                const center = map.getCenter()
                if (!center) return
                const bounds = map.getBounds()
                let radius = 5000
                if (bounds) {
                  const ne = bounds.getNorthEast()
                  const toRad = (d: number) => d * Math.PI / 180
                  const lat1 = toRad(center.lat())
                  const lat2 = toRad(ne.lat())
                  const dLat = toRad(ne.lat() - center.lat())
                  const dLng = toRad(ne.lng() - center.lng())
                  const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2
                  const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                  radius = Math.max(300, Math.min(Math.round(dist * 0.5), 50000))
                }
                onCategoryChange(cat.id as string | undefined, center.lat(), center.lng(), radius)
              }}
              className={`flex shrink-0 items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-sakura-dark text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={cat.label}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          )
        })}
        </div>

        {/* 하단: 별점 필터 + 정렬 + 검색 */}
        <div className="flex w-fit items-center gap-0.5 rounded-2xl bg-card/95 backdrop-blur-sm px-1 sm:px-1.5 py-1 sm:py-1.5 shadow-lg border border-border">

        {/* Google 별점 드롭다운 */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setRatingOpen(!ratingOpen)}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              minRating != null
                ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
            <span className="hidden sm:inline">별점 필터</span>
            <span className="sm:hidden text-[10px]">별점</span>
            {minRating != null && (
              <span className="text-[10px] font-bold ml-0.5">{minRating}+</span>
            )}
            <svg className={`w-3 h-3 transition-transform ${ratingOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* 드롭다운 메뉴 (위로 열림) */}
          {ratingOpen && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[140px] rounded-xl bg-card/95 backdrop-blur-sm shadow-lg border border-border py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium border-b border-border/50">
                Google 별점 필터
              </div>
              {RATING_OPTIONS.map((opt) => {
                const isActive = minRating === opt.value
                return (
                  <button
                    key={opt.label}
                    onClick={() => {
                      onMinRatingChange(opt.value as number | undefined)
                      setRatingOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isActive && <span className="text-yellow-500">✓</span>}
                      <Star className={`w-3 h-3 ${opt.value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 정렬 드롭다운 */}
        {onSortChange && (
          <div className="relative shrink-0" ref={sortDropdownRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                sortBy && sortBy !== "popularity"
                  ? "bg-indigo-400/20 text-indigo-700 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "인기순"}</span>
              <svg className={`w-3 h-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {/* 정렬 드롭다운 메뉴 (위로 열림) */}
            {sortOpen && (
              <div className="absolute bottom-full left-0 mb-1 min-w-[140px] rounded-xl bg-card/95 backdrop-blur-sm shadow-lg border border-border py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium border-b border-border/50">
                  정렬 기준
                </div>
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortBy === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortChange(opt.value)
                        setSortOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-indigo-400/20 text-indigo-700 dark:text-indigo-300"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isActive && <span className="text-indigo-500">✓</span>}
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 구분선 */}
        <div className="w-px h-6 bg-border/60 mx-1 shrink-0" />

        {/* 검색 버튼 */}
        <button
          disabled={isSearching}
          onClick={() => {
            if (!map || isSearching) return
            const center = map.getCenter()
            if (center) {
              setHasClicked(true)
              setShowTooltip(false)
              try { localStorage.setItem(TUTORIAL_KEY, "1") } catch { /* noop */ }
              // 실제 지도 가시 영역에서 반경 계산
              const bounds = map.getBounds()
              let radius = 5000
              if (bounds) {
                const ne = bounds.getNorthEast()
                // 중심에서 모서리까지 거리 (Haversine)
                const toRad = (d: number) => d * Math.PI / 180
                const lat1 = toRad(center.lat())
                const lat2 = toRad(ne.lat())
                const dLat = toRad(ne.lat() - center.lat())
                const dLng = toRad(ne.lng() - center.lng())
                const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2
                const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                // 가시 영역의 ~50% 반경으로 검색 (중심 기준)
                radius = Math.max(300, Math.min(Math.round(dist * 0.5), 50000))
              }
              onSearch(center.lat(), center.lng(), radius)
            }
          }}
          className={`flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-200 ${
            isSearching
              ? "bg-sakura-dark text-white cursor-wait"
              : "bg-sakura-dark text-white hover:bg-sakura-dark/90 hover:shadow-md active:scale-95"
          } ${
            !hasClicked && !isSearching ? "animate-search-pulse" : ""
          }`}
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{isSearching ? "검색 중..." : "검색"}</span>
        </button>
        </div>
      </div>
    </div>
  )
}

/** 장소 텍스트 검색바 (지도 상단) */
function TextSearchBar({
  onSearch,
  isSearching,
}: {
  onSearch: (query: string) => void
  isSearching?: boolean
}) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q || isSearching) return
    onSearch(q)
  }

  return (
    <div className="absolute top-3 left-2 right-14 sm:top-4 sm:left-3 sm:right-16 z-10">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 rounded-2xl bg-card/95 backdrop-blur-sm px-2 py-1.5 shadow-lg border border-border">
        <Search className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소 검색 (예: 이치란 라멘, 도톤보리)"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="shrink-0 rounded-xl bg-sakura-dark px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 hover:bg-sakura-dark/90 transition-colors"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "검색"}
        </button>
      </form>
    </div>
  )
}

// ── 간소화된 지도 스타일 (POI/대중교통 등 시각 노이즈 감소) ──
// 비즈니스·도로 라벨 등은 항상 숨기고, 나머지는 토글 가능
const BASE_HIDDEN_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
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

function buildMapStyles(hiddenPois: Set<string>): google.maps.MapTypeStyle[] {
  const styles = [...BASE_HIDDEN_STYLES]
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
}: {
  hiddenPois: Set<string>
  onTogglePoi: (poiId: string) => void
  onClearMarkers?: () => void
  hasCityPlaces: boolean
}) {
  const [layerOpen, setLayerOpen] = useState(false)

  return (
    <div className="absolute top-28 right-2.5 z-10 flex flex-col items-end gap-1.5">
      {/* 마커 초기화 버튼 */}
      {onClearMarkers && hasCityPlaces && (
        <button
          onClick={onClearMarkers}
          className="bg-background/90 backdrop-blur-sm text-foreground p-2 rounded-lg shadow-md border border-border/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="마커 초기화"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      {/* 레이어 토글 버튼 */}
      <button
        onClick={() => setLayerOpen(!layerOpen)}
        className={`p-2 rounded-lg shadow-md border transition-all ${
          layerOpen
            ? "bg-sakura-dark text-white border-sakura-dark"
            : "bg-background/90 backdrop-blur-sm text-foreground border-border/50 hover:bg-muted"
        }`}
        title="지도 레이어"
      >
        <Layers className="w-4 h-4" />
      </button>

      {/* 레이어 설정 드롭다운 */}
      {layerOpen && (
        <div className="w-36 rounded-xl bg-card/95 backdrop-blur-sm shadow-lg border border-border py-1.5">
          <div className="px-3 py-1 text-[10px] text-muted-foreground font-medium border-b border-border/50">
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

export function MapView({ center, zoom, className = "", places = [], allCityPlaces = [], activeDayIndex = 0, selectedPlaceId, onSelectPlace, onAddPlace, onRemovePlace, onPoiClick, onSearchArea, isSearching, searchMessage, activeCategory, onCategoryChange, minRating, onMinRatingChange, onClearMarkers, sortBy, onSortChange, onTextSearch, isTextSearching }: MapViewProps) {
  const { isDarkMode } = useUIStore()
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

  const dynamicStyles = useMemo(() => buildMapStyles(hiddenPois), [hiddenPois])

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

  const mapId = isDarkMode ? darkMapId : lightMapId

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
            sortBy={sortBy}
            onSortChange={onSortChange}
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
        />
      </APIProvider>
    </div>
  )
}
