import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { TrendingUp, Clock, Trophy, Search, ThumbsUp, MessageCircle, PenSquare, Lightbulb, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockFreePosts } from "@/lib/mockCommunity"
import { normalizeCommunityPost, unwrapProfile } from "@/lib/communityTransforms"
import { useAuthStore } from "@/stores/authStore"
import type { CommunityPost, PostSortOption } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
import { LevelBadge } from "./LevelBadge"
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

/** HTML 본문에서 첫 번째 이미지 src 추출 */
function extractFirstImage(html?: string | null): string | null {
  if (!html) return null
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match?.[1] ?? null
}

const LIKES_FILTERS = [
  { value: 0, label: "전체" },
  { value: 5, label: "5+" },
  { value: 10, label: "10+" },
  { value: 20, label: "20+" },
] as const

const PAGE_SIZE = 20

export function FreeBoardPage() {
  const navigate = useNavigate()
  const { user, isDemoMode, setShowLoginModal } = useAuthStore()
  const useMock = !isSupabaseConfigured || isDemoMode

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [sort, setSort] = useState<PostSortOption>("latest")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"all" | "title" | "author">("all")
  const [minLikes, setMinLikes] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)

  // 썸네일 호버
  const [hoverImg, setHoverImg] = useState<{ src: string; x: number; y: number } | null>(null)

  const fetchIdRef = useRef(0)

  const fetchPosts = useCallback(async () => {
    const id = ++fetchIdRef.current
    setIsLoading(true)
    if (useMock) {
      const mockSort = sort === "best" ? "popular" : sort
      let result = fetchMockFreePosts(mockSort, searchType === "author" ? undefined : searchQuery)
      // 작성자 검색 (mock)
      if (searchQuery && searchType === "author") {
        const q = searchQuery.toLowerCase()
        result = result.filter((p) => {
          const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
          return prof?.nickname?.toLowerCase().includes(q)
        })
      }
      if (sort === "best") {
        result = result.filter((p) => p.likes_count >= BEST_THRESHOLD)
      }
      if (id === fetchIdRef.current) {
        setPosts(result)
        setIsLoading(false)
      }
      return
    }

    let query = supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("board_type", "free")

    if (searchQuery) {
      if (searchType === "title") {
        query = query.ilike("title", `%${searchQuery}%`)
      } else if (searchType === "all") {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }
      // 작성자 검색은 클라이언트 필터링 (profiles join 후)
    }

    if (sort === "popular" || sort === "best") {
      query = query.order("likes_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.limit(500)

    try {
      const { data, error } = await query
      if (id !== fetchIdRef.current) return // stale request
      if (error) {
        console.error("게시글 로드 실패:", error)
        setPosts([])
        return
      }
      let normalized = ((data as CommunityPost[]) ?? []).map(normalizeCommunityPost)
      // 작성자 검색 클라이언트 필터링
      if (searchQuery && searchType === "author") {
        const q = searchQuery.toLowerCase()
        normalized = normalized.filter((p) => {
          const prof = unwrapProfile(p.profiles)
          return prof?.nickname?.toLowerCase().includes(q)
        })
      }
      if (sort === "best") {
        normalized = normalized.filter((p) => p.likes_count >= BEST_THRESHOLD)
      }
      setPosts(normalized)
    } catch (e) {
      if (id === fetchIdRef.current) {
        console.error("게시글 로드 실패:", e)
        setPosts([])
      }
    } finally {
      if (id === fetchIdRef.current) setIsLoading(false)
    }
  }, [sort, searchQuery, searchType, useMock])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { setPage(1) }, [sort, searchQuery, minLikes])

  const filteredPosts = useMemo(() => {
    if (minLikes <= 0) return posts
    return posts.filter((p) => p.likes_count >= minLikes)
  }, [posts, minLikes])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE))
  const visiblePosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreateClick = () => {
    if (!user) { setShowLoginModal(true); return }
    navigate("/community/free/write")
  }

  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleMouseMove = (e: React.MouseEvent, post: CommunityPost) => {
    const img = extractFirstImage(post.content) || post.cover_image
    if (img) {
      setHoverImg({ src: img, x: e.clientX + 16, y: e.clientY + 16 })
    }
  }

  const handleMouseLeave = () => setHoverImg(null)

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

      {/* 검색 (버튼 방식) */}
      <div className="mb-4 flex gap-2">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as "all" | "title" | "author")}
          className="shrink-0 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">제목+내용</option>
          <option value="title">제목</option>
          <option value="author">작성자</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchType === "author" ? "작성자 닉네임 검색..." : "제목 또는 내용으로 검색..."}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" className="shrink-0 gap-1.5 rounded-xl">
          <Search className="h-4 w-4" />
          검색
        </Button>
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

        {/* 글 수 표시 */}
        <span className="ml-auto text-xs text-muted-foreground">
          총 {filteredPosts.length}건
        </span>
      </div>

      {/* 게시글 리스트 */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-primary/10">
            <PenSquare className="h-8 w-8 text-primary/50" />
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
          {/* 테이블 헤더 (데스크탑) */}
          <div className="hidden sm:flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span className="flex-1">제목</span>
            <span className="w-24 text-center">작성자</span>
            <span className="w-10 text-center">추천</span>
            <span className="w-10 text-center">댓글</span>
            <span className="w-16 text-right">날짜</span>
          </div>

          {visiblePosts.map((post, idx) => {
            const profile = unwrapProfile(post.profiles)
            const isBest = post.likes_count >= BEST_THRESHOLD
            const hasImage = !!(extractFirstImage(post.content) || post.cover_image)

            return (
              <Link
                key={post.id}
                to={`/community/${post.id}`}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
                  idx > 0 ? "border-t border-border/60" : ""
                } ${isBest ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
                onMouseMove={(e) => handleMouseMove(e, post)}
                onMouseLeave={handleMouseLeave}
              >
                {/* 베스트 뱃지 */}
                {isBest && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <Trophy className="h-2.5 w-2.5" />
                  </span>
                )}

                {/* 제목 + 모바일 메타 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {post.title}
                    {hasImage && <ImageIcon className="ml-1 inline h-3 w-3 text-muted-foreground" />}
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // 최대 7개 표시: 현재 ±3
              if (totalPages <= 7) return true
              if (p === 1 || p === totalPages) return true
              return Math.abs(p - page) <= 2
            })
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1]) > 1) acc.push("...")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-xs text-muted-foreground">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[2rem] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    page === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 마우스 호버 썸네일 */}
      {hoverImg && (
        <div
          className="pointer-events-none fixed z-[200] hidden sm:block"
          style={{ left: hoverImg.x, top: hoverImg.y }}
        >
          <img
            src={hoverImg.src}
            alt=""
            className="h-32 w-40 rounded-xl border border-border bg-card object-cover shadow-xl"
          />
        </div>
      )}

      {/* 실시간 채팅 */}
      <ChatPanel />
    </div>
  )
}
