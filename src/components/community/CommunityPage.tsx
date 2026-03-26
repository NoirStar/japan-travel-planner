import { useState, useEffect, useCallback, useRef, useMemo, Component, type ReactNode } from "react"
import { Plus, TrendingUp, Clock, Trophy, MapPin, Search, RefreshCw, X } from "lucide-react"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockPosts } from "@/lib/mockCommunity"
import { normalizeCommunityPost } from "@/lib/communityTransforms"
import { useAuthStore } from "@/stores/authStore"
import { useSessionState } from "@/hooks/useSessionState"
import type { CommunityPost, PostSortOption, TravelPostStage } from "@/types/community"
import { BEST_THRESHOLD, POST_STAGE_LABELS } from "@/types/community"
import { PostCard } from "./PostCard"
import { CreatePostModal } from "./CreatePostModal"
import { cities } from "@/data/cities"

/** 개별 PostCard 에러 격리 — 하나의 카드가 깨져도 나머지는 정상 렌더 */
class CardErrorBoundary extends Component<
  { postDebug?: unknown; children: ReactNode },
  { hasError: boolean; msg: string; debugData: string }
> {
  constructor(props: { postDebug?: unknown; children: ReactNode }) {
    super(props)
    this.state = { hasError: false, msg: "", debugData: "" }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, msg: error.message }
  }
  componentDidCatch(error: Error) {
    const data = JSON.stringify(this.props.postDebug, (_k, v) =>
      typeof v === "object" && v !== null && !Array.isArray(v) ? `[Object: ${Object.keys(v).join(",")}]` : v
    , 2).slice(0, 500)
    console.error("PostCard 렌더 에러:", error.message, "\nPost data:", data)
    this.setState({ debugData: data })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs text-muted-foreground">
          <p>이 게시글을 표시할 수 없습니다</p>
          {import.meta.env.DEV && (
            <details className="mt-2 max-h-32 w-full overflow-auto text-left text-[10px]">
              <summary className="cursor-pointer">에러 상세 (개발 모드)</summary>
              <pre className="mt-1 whitespace-pre-wrap opacity-60">{this.state.msg}</pre>
              <pre className="mt-1 whitespace-pre-wrap opacity-40">{this.state.debugData}</pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export function CommunityPage() {
  const { user, setShowLoginModal } = useAuthStore()
  const location = useLocation()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [sort, setSort] = useSessionState<PostSortOption>("community:sort", "latest")
  const [cityFilter, setCityFilter] = useSessionState("community:city", "")
  const [searchQuery, setSearchQuery] = useSessionState("community:search", "")
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [minLikes, setMinLikes] = useSessionState("community:minLikes", 0)
  const [stageFilter, setStageFilter] = useSessionState<"" | TravelPostStage>("community:stage", "")
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [displayCount, setDisplayCount] = useState(9)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /* 플래너에서 "후기 작성" 으로 넘어온 경우 자동 모달 열기 */
  const navState = (location.state ?? {}) as { openCreatePost?: boolean; tripId?: string; defaultStage?: TravelPostStage }
  const [createDefaultStage, setCreateDefaultStage] = useState<TravelPostStage | undefined>(navState.defaultStage)
  const [createDefaultTripId, setCreateDefaultTripId] = useState<string | undefined>(navState.tripId)
  useEffect(() => {
    if (navState.openCreatePost && user) {
      setCreateDefaultStage(navState.defaultStage)
      setCreateDefaultTripId(navState.tripId)
      setShowCreate(true)
      window.history.replaceState({}, "")
    }
  }, [location.state, user])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchPosts = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setFetchError(null)

    if (!isSupabaseConfigured) {
      const mockSort = sort === "best" ? "popular" : sort
      let result = fetchMockPosts(mockSort, cityFilter, searchQuery)
      if (sort === "best") {
        result = result.filter((p) => p.likes_count >= BEST_THRESHOLD)
      }
      if (stageFilter) {
        result = result.filter((p) => (p.travel_post_stage ?? "plan") === stageFilter)
      }
      setPosts(result)
      setIsLoading(false)
      return
    }

    let query = supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("board_type", "travel")

    if (cityFilter) {
      query = query.eq("city_id", cityFilter)
    }

    if (stageFilter) {
      query = query.eq("travel_post_stage", stageFilter)
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    if (sort === "popular") {
      query = query.order("likes_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.limit(50).abortSignal(controller.signal)

    try {
      const { data, error } = await query
      if (error) {
        console.error("게시글 로드 실패:", error)
        setFetchError("게시글을 불러오지 못했어요")
        return
      }
      const normalized = ((data as CommunityPost[]) ?? []).map(normalizeCommunityPost)
      setPosts(normalized)
    } catch (e) {
      if (controller.signal.aborted) return
      console.error("게시글 로드 실패:", e)
      setFetchError("게시글을 불러오지 못했어요")
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [sort, cityFilter, searchQuery, stageFilter])

  useEffect(() => {
    fetchPosts()
    return () => { abortRef.current?.abort() }
  }, [fetchPosts])

  // 필터/정렬 변경 시 displayCount 초기화
  useEffect(() => {
    setDisplayCount(9)
  }, [sort, cityFilter, searchQuery, minLikes, stageFilter])

  const filteredPosts = useMemo(() => {
    if (minLikes <= 0) return posts
    return posts.filter((p) => p.likes_count >= minLikes)
  }, [posts, minLikes])

  // IntersectionObserver 기반 무한스크롤
  useEffect(() => {
    if (displayCount >= filteredPosts.length) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDisplayCount((c) => c + 9) },
      { rootMargin: "200px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [displayCount, filteredPosts.length])

  const visiblePosts = filteredPosts.slice(0, displayCount)

  const handleCreateClick = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setShowCreate(true)
  }

  return (
    <div className="min-h-screen bg-background">
    <div className="flex">
      {/* ── 데스크톱: 사이드바 필터 ── */}
      <aside className="hidden lg:block w-[240px] shrink-0 sticky top-0 h-dvh overflow-y-auto border-r border-border/30 bg-card/50 p-5">
        {/* 검색 */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 정렬 */}
        <div className="mb-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">정렬</h4>
          <div className="flex flex-col gap-0.5">
            {([["latest", "최신", Clock], ["popular", "인기", TrendingUp], ["best", "베스트", Trophy]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  sort === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 유형 */}
        <div className="mb-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">유형</h4>
          <div className="flex flex-col gap-0.5">
            {(["" as const, "plan" as const, "review" as const]).map((stage) => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  stageFilter === stage ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {stage === "" ? "전체" : POST_STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>

        {/* 도시 */}
        <div className="mb-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">도시</h4>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => setCityFilter("")}
              className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                !cityFilter ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              전체
            </button>
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => setCityFilter(city.id)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  cityFilter === city.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* 추천수 */}
        <div className="mb-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">추천수</h4>
          <div className="flex flex-col gap-0.5">
            {[{ v: 0, l: "전체" }, { v: 5, l: "5+" }, { v: 10, l: "10+" }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setMinLikes(v)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  minLikes === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 활성 필터 리셋 */}
        {(searchQuery || cityFilter || minLikes > 0 || stageFilter) && (
          <button
            onClick={() => { setSearchInput(""); setSearchQuery(""); setCityFilter(""); setMinLikes(0); setStageFilter("") }}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <X className="h-3 w-3" />
            필터 초기화
          </button>
        )}
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 min-w-0 px-5 lg:px-8 pt-6 pb-14">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">여행 일정 공유</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {filteredPosts.length}개의 여행 일정
            </p>
          </div>
          <Button onClick={handleCreateClick} className="gap-1.5 rounded-xl text-xs h-9 px-4">
            <Plus className="h-3.5 w-3.5" />
            내 일정 올리기
          </Button>
        </div>

        {/* 모바일: 인라인 필터 + 검색 */}
        <div className="mb-4 lg:hidden">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex shrink-0 rounded-lg border border-border bg-muted p-0.5">
              {(["latest", "popular", "best"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
                    sort === s ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {s === "latest" ? "최신" : s === "popular" ? "인기" : "베스트"}
                </button>
              ))}
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-7 shrink-0 rounded-lg border border-border bg-muted px-2 text-[11px] font-medium outline-none"
            >
              <option value="">전체 도시</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as "" | TravelPostStage)}
              className="h-7 shrink-0 rounded-lg border border-border bg-muted px-2 text-[11px] font-medium outline-none"
            >
              <option value="">전체</option>
              <option value="plan">계획</option>
              <option value="review">후기</option>
            </select>
          </div>
        </div>

        {/* 게시글 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-shimmer rounded-xl" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 py-16 px-6 text-center">
            <RefreshCw className="h-8 w-8 text-destructive/40" />
            <p className="text-sm font-semibold text-foreground">{fetchError}</p>
            <Button onClick={fetchPosts} variant="outline" size="sm" className="gap-2 rounded-lg">
              <RefreshCw className="h-3.5 w-3.5" /> 다시 시도
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 py-16 px-6 text-center">
            <MapPin className="h-8 w-8 text-primary/40" />
            <p className="text-sm font-semibold text-foreground">아직 공유된 여행이 없어요</p>
            <p className="text-xs text-muted-foreground">첫 번째로 여행을 공유해보세요!</p>
            <Button onClick={handleCreateClick} size="sm" className="gap-2 rounded-lg mt-2">
              <Plus className="h-3.5 w-3.5" /> 내 일정 올리기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visiblePosts.map((post) => (
              <CardErrorBoundary key={post.id} postDebug={post}>
                <PostCard post={post} />
              </CardErrorBoundary>
            ))}
          </div>
        )}

        {/* 무한스크롤 sentinel */}
        {displayCount < filteredPosts.length && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>

      {/* 글쓰기 모달 */}
      <CreatePostModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateDefaultStage(undefined); setCreateDefaultTripId(undefined) }}
        onCreated={() => { setSort("latest"); fetchPosts() }}
        defaultStage={createDefaultStage}
        defaultTripId={createDefaultTripId}
      />

    </div>
  )
}
