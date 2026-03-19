import { useState, useEffect, useCallback, useRef, useMemo, Component, type ReactNode } from "react"
import { Plus, TrendingUp, Clock, Trophy, MapPin, Search, ThumbsUp, RefreshCw } from "lucide-react"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockPosts } from "@/lib/mockCommunity"
import { normalizeCommunityPost } from "@/lib/communityTransforms"
import { useAuthStore } from "@/stores/authStore"
import { useSessionState } from "@/hooks/useSessionState"
import type { CommunityPost, PostSortOption } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
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
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useSessionState("community:search", "")
  const [minLikes, setMinLikes] = useSessionState("community:minLikes", 0)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [displayCount, setDisplayCount] = useState(9)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /* 플래너에서 "후기 작성" 으로 넘어온 경우 자동 모달 열기 */
  useEffect(() => {
    const navState = location.state as { openCreatePost?: boolean } | null
    if (navState?.openCreatePost && user) {
      setShowCreate(true)
      // state를 지워서 새로고침 시 다시 열리지 않게
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
  }, [sort, cityFilter, searchQuery])

  useEffect(() => {
    fetchPosts()
    return () => { abortRef.current?.abort() }
  }, [fetchPosts])

  // 필터/정렬 변경 시 displayCount 초기화
  useEffect(() => {
    setDisplayCount(9)
  }, [sort, cityFilter, searchQuery, minLikes])

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
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-10">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">여행 공유</h1>
          <p className="text-sm text-muted-foreground">다른 여행자들의 일본 일정을 구경하세요 ✈️</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateClick} className="gap-1.5 rounded-xl btn-gradient text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">여행 공유</span>
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 설명으로 검색..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* 필터 바 */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* 정렬 */}
        <div className="flex rounded-xl border border-border bg-card p-0.5">
          <button
            onClick={() => setSort("latest")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sort === "latest" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            최신
          </button>
          <button
            onClick={() => setSort("popular")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sort === "popular" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            인기
          </button>
          <button
            onClick={() => setSort("best")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sort === "best" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3 w-3" />
            베스트
          </button>
        </div>

        {/* 도시 필터 */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs outline-none"
        >
          <option value="">전체 도시</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        {/* 추천수 필터 — 모바일에서 숨김 */}
        <div className="hidden rounded-xl border border-border bg-card p-0.5 sm:flex">
          {[{ value: 0, label: "전체" }, { value: 5, label: "5+" }, { value: 10, label: "10+" }].map((f) => (
            <button
              key={f.value}
              onClick={() => setMinLikes(f.value)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                minLikes === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.value > 0 && <ThumbsUp className="h-2.5 w-2.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 게시글 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-shimmer rounded-2xl border border-border" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold">{fetchError}</p>
          <p className="mt-1 text-sm text-muted-foreground">네트워크 상태를 확인하고 다시 시도해주세요</p>
          <Button onClick={fetchPosts} variant="outline" className="mt-4 gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" /> 다시 시도
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-8 w-8 text-primary/50" />
          </div>
          <p className="mt-3 text-lg font-semibold">아직 공유된 여행이 없어요</p>
          <p className="text-sm text-muted-foreground">첫 번째로 여행을 공유해보세요!</p>
          <Button onClick={handleCreateClick} className="mt-4 gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            여행 공유하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        onClose={() => setShowCreate(false)}
        onCreated={() => { setSort("latest"); fetchPosts() }}
      />

    </div>
  )
}
