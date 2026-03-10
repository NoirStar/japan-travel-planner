import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Link } from "react-router-dom"
import { TrendingUp, Clock, Trophy, Search, ThumbsUp, MessageCircle, PenSquare, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockFreePosts } from "@/lib/mockCommunity"
import { useAuthStore } from "@/stores/authStore"
import type { CommunityPost, PostSortOption } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
import { LevelBadge } from "./LevelBadge"
import { CreateFreePostModal } from "./CreateFreePostModal"
import { ChatPanel } from "./ChatPanel"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
}

const LIKES_FILTERS = [
  { value: 0, label: "전체" },
  { value: 5, label: "5+" },
  { value: 10, label: "10+" },
  { value: 20, label: "20+" },
] as const

export function FreeBoardPage() {
  const { user, isDemoMode, setShowLoginModal } = useAuthStore()
  const useMock = !isSupabaseConfigured || isDemoMode

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [sort, setSort] = useState<PostSortOption>("latest")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [minLikes, setMinLikes] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [displayCount, setDisplayCount] = useState(20)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    if (useMock) {
      const mockSort = sort === "best" ? "popular" : sort
      let result = fetchMockFreePosts(mockSort, searchQuery)
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
      .eq("board_type", "free")

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    if (sort === "popular" || sort === "best") {
      query = query.order("likes_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.limit(100)

    try {
      const { data } = await query
      let normalized = ((data as CommunityPost[]) ?? []).map((p) => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        likes_count: Number(p.likes_count) || 0,
        dislikes_count: Number(p.dislikes_count) || 0,
        comments_count: Number(p.comments_count) || 0,
      }))
      if (sort === "best") {
        normalized = normalized.filter((p) => p.likes_count >= BEST_THRESHOLD)
      }
      setPosts(normalized)
    } catch (e) {
      console.error("게시글 로드 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [sort, searchQuery, useMock])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { setDisplayCount(20) }, [sort, searchQuery, minLikes])

  const filteredPosts = useMemo(() => {
    if (minLikes <= 0) return posts
    return posts.filter((p) => p.likes_count >= minLikes)
  }, [posts, minLikes])

  // Infinite scroll
  useEffect(() => {
    if (displayCount >= filteredPosts.length) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDisplayCount((c) => c + 20) },
      { rootMargin: "200px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [displayCount, filteredPosts.length])

  const visiblePosts = filteredPosts.slice(0, displayCount)

  const handleCreateClick = () => {
    if (!user) { setShowLoginModal(true); return }
    setShowCreate(true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-10">
      {/* 로컬스토리지 안내 */}
      {!isSupabaseConfigured && !isDemoMode && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
          <Lightbulb className="inline h-3.5 w-3.5 mr-1" />현재 데모 모드입니다. 글·댓글은 이 브라우저에만 저장됩니다.
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">자유게시판</h1>
          <p className="text-sm text-muted-foreground">자유롭게 이야기를 나눠보세요</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2 rounded-xl">
          <PenSquare className="h-4 w-4" />
          <span className="hidden sm:inline">글쓰기</span>
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 내용으로 검색..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* 필터 바 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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

        {/* 추천수 필터 */}
        <div className="flex rounded-xl border border-border bg-card p-0.5">
          {LIKES_FILTERS.map((f) => (
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

      {/* 게시글 리스트 */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <PenSquare className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mt-3 text-lg font-semibold">
            {searchQuery ? "검색 결과가 없습니다" : "아직 글이 없어요"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "다른 검색어로 시도해보세요" : "첫 번째 글을 작성해보세요!"}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateClick} className="mt-4 gap-2 rounded-xl">
              <PenSquare className="h-4 w-4" /> 글쓰기
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {visiblePosts.map((post, idx) => {
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
            const isBest = post.likes_count >= BEST_THRESHOLD
            return (
              <Link
                key={post.id}
                to={`/community/${post.id}`}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
                  idx > 0 ? "border-t border-border/60" : ""
                } ${isBest ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
              >
                {/* 베스트 뱃지 */}
                {isBest && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <Trophy className="h-2.5 w-2.5" />
                  </span>
                )}

                {/* 제목 + 모바일 메타 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.title}
                    {post.comments_count > 0 && (
                      <span className="ml-1.5 text-xs text-primary font-semibold">[{post.comments_count}]</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 sm:hidden text-[11px] text-muted-foreground">
                    <span>{profile?.nickname ?? "익명"}</span>
                    {profile && <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />}
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" /> {post.likes_count}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>

                {/* 데스크탑 메타 */}
                <div className="hidden sm:flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 w-24 truncate">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                        {profile?.nickname?.charAt(0) ?? "?"}
                      </div>
                    )}
                    {profile?.nickname ?? "익명"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 w-10 justify-end">
                    <ThumbsUp className="h-3 w-3" /> {post.likes_count}
                  </span>
                  <span className="inline-flex items-center gap-0.5 w-10 justify-end">
                    <MessageCircle className="h-3 w-3" /> {post.comments_count}
                  </span>
                  <span className="w-16 text-right">{timeAgo(post.created_at)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* 무한스크롤 sentinel */}
      {displayCount < filteredPosts.length && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* 글쓰기 모달 */}
      <CreateFreePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setSort("latest"); fetchPosts() }}
      />

      {/* 실시간 채팅 */}
      <ChatPanel />
    </div>
  )
}
