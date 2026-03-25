import { useState, useEffect, useCallback, useRef, useMemo, Component, type ReactNode } from "react"
import { Plus, TrendingUp, Clock, Trophy, MapPin, Search, RefreshCw, Plane, X } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-sakura-pattern">
    <div className="mx-auto max-w-5xl px-5 lg:px-8 pt-24 pb-14">
      {/* 헤더 */}
      <div className="mb-8 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="chip chip-primary mb-2 inline-block">여행 일정 공유</span>
          <h1 className="text-headline font-bold truncate">커뮤니티</h1>
          <p className="mt-1 text-body-sm text-muted-foreground inline-flex items-center gap-1">다른 여행자들의 일본 일정을 구경하세요 <Plane className="h-3.5 w-3.5" /></p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={handleCreateClick} className="gap-1.5 rounded-xl text-body-sm h-10 px-4 sm:h-11 sm:px-5 sm:gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">내 일정 올리기</span>
            <span className="sm:hidden">글쓰기</span>
          </Button>
        </div>
      </div>

      {/* 검색 + 필터 그룹 */}
      <div className="surface-controls mb-6 space-y-3">
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목 또는 설명으로 검색..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-body-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>

        {/* 필터 바 */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {/* 정렬 */}
        <div className="flex shrink-0 rounded-lg border border-border bg-muted p-0.5">
          <button
            onClick={() => setSort("latest")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              sort === "latest" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            최신
          </button>
          <button
            onClick={() => setSort("popular")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              sort === "popular" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            인기
          </button>
          <button
            onClick={() => setSort("best")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              sort === "best" ? "bg-card text-warning shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3 w-3" />
            베스트
          </button>
        </div>

        {/* 계획/후기 */}
        <div className="flex shrink-0 rounded-lg border border-border bg-muted p-0.5">
          {(["" as const, "plan" as const, "review" as const]).map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                stageFilter === stage
                  ? stage === "review" ? "bg-card text-success shadow-sm" : "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {stage === "" ? "전체" : POST_STAGE_LABELS[stage]}
            </button>
          ))}
        </div>

        {/* 도시 */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-8 shrink-0 rounded-lg border border-border bg-muted px-2.5 text-xs font-medium outline-none"
        >
          <option value="">전체 도시</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        {/* 추천수 */}
        <select
          value={minLikes}
          onChange={(e) => setMinLikes(Number(e.target.value))}
          className="h-8 shrink-0 rounded-lg border border-border bg-muted px-2.5 text-xs font-medium outline-none"
        >
          <option value={0}>추천 전체</option>
          <option value={5}>추천 5+</option>
          <option value={10}>추천 10+</option>
        </select>

        {/* 활성 필터 리셋 */}
        {(searchQuery || cityFilter || minLikes > 0 || stageFilter) && (
          <button
            onClick={() => { setSearchInput(""); setSearchQuery(""); setCityFilter(""); setMinLikes(0); setStageFilter("") }}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            초기화
          </button>
        )}

        {/* 게시글 수 — 모바일에서는 숨김 */}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {filteredPosts.length}건
        </span>
      </div>
      </div>

      {/* 게시글 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 py-16 px-6 text-center">
              <RefreshCw className="h-8 w-8 text-destructive/40" />
              <div>
                <p className="text-body-sm font-semibold text-foreground">{fetchError}</p>
                <p className="mt-1 text-body-sm text-muted-foreground">일시적인 문제일 수 있어요. 잠시 후 다시 시도해주세요.</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={fetchPosts} variant="outline" className="gap-2 rounded-xl">
                  <RefreshCw className="h-4 w-4" /> 다시 시도
                </Button>
                <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => navigate("/")}>
                  홈으로
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 py-16 px-6 text-center">
              <MapPin className="h-8 w-8 text-primary/40" />
              <div>
                <p className="text-body-sm font-semibold text-foreground">아직 공유된 여행이 없어요</p>
                <p className="mt-1 text-body-sm text-muted-foreground">첫 번째로 여행을 공유해보세요!</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleCreateClick} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> 내 일정 올리기
                </Button>
                <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => navigate("/planner?new=true")}>
                  플래너에서 여행 만들기
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* 글쓰기 모달 */}
      <CreatePostModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateDefaultStage(undefined); setCreateDefaultTripId(undefined) }}
        onCreated={() => { setSort("latest"); fetchPosts() }}
        defaultStage={createDefaultStage}
        defaultTripId={createDefaultTripId}
      />

    </div>
    </div>
  )
}
