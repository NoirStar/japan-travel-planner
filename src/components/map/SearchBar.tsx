import { useState, useEffect, useRef } from "react"
import { useMap } from "@vis.gl/react-google-maps"
import { MapPin, Utensils, Hotel, ShoppingBag, Camera, Coffee, Star, Search, Loader2, X } from "lucide-react"
import { getVisibleRadius } from "@/lib/mapUtils"

// ── 카테고리 필터 ────────────────────────────
const CATEGORY_FILTERS = [
  { id: undefined, label: "전체", icon: MapPin },
  { id: "attraction", label: "관광지", icon: Camera },
  { id: "restaurant", label: "맛집", icon: Utensils },
  { id: "shopping", label: "쇼핑", icon: ShoppingBag },
  { id: "cafe", label: "카페", icon: Coffee },
  { id: "accommodation", label: "숙소", icon: Hotel },
] as const

// ── Google 별점 드롭다운 옵션 ────────────────────
const RATING_OPTIONS = [
  { value: 4.5, label: "4.5점 이상" },
  { value: 4.0, label: "4.0점 이상" },
  { value: 3.5, label: "3.5점 이상" },
  { value: 3.0, label: "3.0점 이상" },
  { value: 2.0, label: "2.0점 이상" },
  { value: 1.0, label: "1.0점 이상" },
  { value: undefined, label: "전체 (필터 해제)" },
] as const

const TUTORIAL_KEY = "tabitalk-search-tutorial-seen"

/** 통합 검색바: 카테고리 필터 + Google 별점 드롭다운 + 정렬 + 검색 버튼 */
export function UnifiedSearchBar({
  onSearch,
  isSearching,
  activeCategory,
  onCategoryChange,
  minRating,
  onMinRatingChange,
}: {
  onSearch: (lat: number, lng: number, radius: number) => void
  isSearching?: boolean
  activeCategory?: string
  onCategoryChange: (category: string | undefined, lat: number, lng: number, radius: number) => void
  minRating?: number
  onMinRatingChange: (rating: number | undefined) => void
}) {
  const map = useMap()
  const [hasClicked, setHasClicked] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
    if (!ratingOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRatingOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [ratingOpen])

  return (
    <div className="absolute bottom-3 left-2 right-2 sm:bottom-6 sm:left-3 sm:right-3 z-10 flex flex-col items-center pointer-events-none">
      {/* 튜토리얼 툴팁 */}
      {showTooltip && !hasClicked && !isSearching && (
        <div className="relative mb-2.5 rounded-2xl bg-sakura-dark px-4 py-2.5 sm:px-5 sm:py-3 text-caption sm:text-body-sm font-bold text-white shadow-xl animate-bounce pointer-events-auto">
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            지도를 이동 후 검색 버튼을 눌러주세요!
          </span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-sakura-dark" />
        </div>
      )}

      {/* 통합 검색바 */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 sm:gap-2 max-w-full">
        {/* 상단: 카테고리 필터 */}
        <div className="flex items-center gap-1 rounded-2xl bg-card/95 backdrop-blur-sm px-1.5 sm:px-2 py-1.5 sm:py-2 shadow-lg border border-border overflow-x-auto scrollbar-hide">
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id ?? "all"}
              onClick={() => {
                if (!map) return
                const area = getVisibleRadius(map)
                if (!area) return
                onCategoryChange(cat.id as string | undefined, area.lat, area.lng, area.radius)
              }}
              className={`flex shrink-0 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-caption sm:text-body-sm font-semibold whitespace-nowrap transition-all ${
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
        <div className="flex w-fit items-center gap-1 rounded-2xl bg-card/95 backdrop-blur-sm px-1.5 sm:px-2 py-1.5 sm:py-2 shadow-lg border border-border">

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

          {ratingOpen && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[140px] rounded-xl bg-card/95 backdrop-blur-sm shadow-lg border border-border py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium border-b border-border/50">
                별점 필터 (검색 결과 내)
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

        {/* 구분선 */}
        <div className="w-px h-6 bg-border/60 mx-1 shrink-0" />

        {/* 검색 버튼 */}
        <button
          disabled={isSearching}
          onClick={() => {
            if (!map || isSearching) return
            const area = getVisibleRadius(map)
            if (area) {
              setHasClicked(true)
              setShowTooltip(false)
              try { localStorage.setItem(TUTORIAL_KEY, "1") } catch { /* noop */ }
              onSearch(area.lat, area.lng, area.radius)
            }
          }}
          className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-caption sm:text-body-sm font-bold transition-all duration-200 ${
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
export function TextSearchBar({
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
      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl bg-card/95 backdrop-blur-sm px-3 py-2 shadow-lg border border-border">
        <Search className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소 검색 (예: 이치란 라멘, 도톤보리)"
          className="flex-1 bg-transparent text-body-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="shrink-0 rounded-xl bg-sakura-dark px-3.5 py-2 text-body-sm font-bold text-white disabled:opacity-50 hover:bg-sakura-dark/90 transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
        </button>
      </form>
    </div>
  )
}
