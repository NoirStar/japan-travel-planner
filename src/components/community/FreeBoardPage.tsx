import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { TrendingUp, Clock, Trophy, Search, ThumbsUp, MessageCircle, PenSquare, ChevronLeft, ChevronRight, ImageIcon, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockFreePosts } from "@/lib/mockCommunity"
import { normalizeCommunityPost, unwrapProfile } from "@/lib/communityTransforms"
import { useAuthStore } from "@/stores/authStore"
import { useSessionState } from "@/hooks/useSessionState"
import type { CommunityPost, PostSortOption } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
import { LevelBadge } from "./LevelBadge"

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
  const { user, setShowLoginModal } = useAuthStore()
  const useMock = !isSupabaseConfigured

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [sort, setSort] = useSessionState<PostSortOption>("freeboard:sort", "latest")
  const [searchQuery, setSearchQuery] = useSessionState("freeboard:search", "")
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [searchType, setSearchType] = useSessionState<"all" | "title" | "author">("freeboard:searchType", "all")
  const [minLikes, setMinLikes] = useSessionState("freeboard:minLikes", 0)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [page, setPage] = useSessionState("freeboard:page", 1)
  // 작성자 필터
  const [authorFilter, setAuthorFilter] = useState<{ userId: string; nickname: string } | null>(null)

  // 썸네일 호버
  const [hoverImg, setHoverImg] = useState<{ src: string; x: number; y: number } | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchPosts = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setFetchError(null)

    if (useMock) {
      const mockSort = sort === "best" ? "popular" : sort
      let result = fetchMockFreePosts(mockSort, searchType === "author" ? undefined : searchQuery)
      if (searchQuery && searchType === "author") {
        const q = searchQuery.toLowerCase()
        result = result.filter((p) => {
          const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
          return prof?.nickname?.toLowerCase().includes(q)
        })
      }
      if (authorFilter) {
        result = result.filter((p) => p.user_id === authorFilter.userId)
      }
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

    if (authorFilter) {
      query = query.eq("user_id", authorFilter.userId)
    }

    if (searchQuery) {
      if (searchType === "title") {
        query = query.ilike("title", `%${searchQuery}%`)
      } else if (searchType === "all") {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }
    }

    if (sort === "popular" || sort === "best") {
      query = query.order("likes_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.limit(500).abortSignal(controller.signal)

    try {
      const { data, error } = await query
      if (error) {
        console.error("\uac8c\uc2dc\uae00 \ub85c\ub4dc \uc2e4\ud328:", error)
        setFetchError("\uac8c\uc2dc\uae00\uc744 \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc5b4\uc694")
        return
      }
      let normalized = ((data as CommunityPost[]) ?? []).map(normalizeCommunityPost)
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
      if (controller.signal.aborted) return
      console.error("\uac8c\uc2dc\uae00 \ub85c\ub4dc \uc2e4\ud328:", e)
      setFetchError("\uac8c\uc2dc\uae00\uc744 \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc5b4\uc694")
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [sort, searchQuery, searchType, authorFilter, useMock])

  useEffect(() => {
    fetchPosts()
    return () => { abortRef.current?.abort() }
  }, [fetchPosts])
  useEffect(() => { setPage(1) }, [sort, searchQuery, minLikes, authorFilter])

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

  const handleTitleMouseMove = (e: React.MouseEvent, post: CommunityPost) => {
    const img = extractFirstImage(post.content) || post.cover_image
    if (img) {
      setHoverImg({ src: img, x: e.clientX + 16, y: e.clientY + 16 })
    }
  }

  const handleTitleMouseLeave = () => setHoverImg(null)

  const handleAuthorClick = (e: React.MouseEvent, post: CommunityPost) => {
    e.preventDefault()
    e.stopPropagation()
    const profile = unwrapProfile(post.profiles)
    if (!profile) return
    setAuthorFilter({ userId: post.user_id, nickname: profile.nickname })
  }

  return (
    <div className="min-h-screen bg-background">
    <div className="flex">
      {/* ── 데스크톱: 사이드바 필터 ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-border/30 bg-card/50 p-5">
        {/* 검색 */}
        <div className="mb-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">검색</h4>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "all" | "title" | "author")}
            className="w-full mb-2 rounded-lg border border-border bg-card px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">제목+내용</option>
            <option value="title">제목</option>
            <option value="author">작성자</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="검색..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
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

        {/* 추천수 */}
        <div className="mb-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">추천수</h4>
          <div className="flex flex-col gap-0.5">
            {LIKES_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setMinLikes(f.value)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  minLikes === f.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 작성자 필터 */}
        {authorFilter && (
          <button
            onClick={() => setAuthorFilter(null)}
            className="flex items-center gap-1 w-full rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-3 w-3" />
            {authorFilter.nickname} 필터 해제
          </button>
        )}
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 min-w-0 px-5 lg:px-8 pt-6 pb-14">
      {/* 헤더 */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold">자유게시판</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredPosts.length}개의 글 · 자유롭게 이야기를 나눠보세요
          </p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2 rounded-xl px-5">
          <PenSquare className="h-4 w-4" />
          <span className="hidden sm:inline">글쓰기</span>
        </Button>
      </div>

      {/* 모바일: 인라인 검색 + 필터 */}
      <div className="mb-4 lg:hidden">
        <div className="flex gap-2 mb-3">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "all" | "title" | "author")}
            className="shrink-0 rounded-lg border border-border bg-card px-2 py-2 text-xs outline-none"
          >
            <option value="all">제목+내용</option>
            <option value="title">제목</option>
            <option value="author">작성자</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="검색..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="sm" className="shrink-0">
            <Search className="h-3.5 w-3.5" />
          </Button>
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
          {authorFilter && (
            <button onClick={() => setAuthorFilter(null)} className="chip chip-primary gap-1 shrink-0">
              {authorFilter.nickname} <X className="h-3 w-3" />
            </button>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{filteredPosts.length}건</span>
        </div>
      </div>

      {/* 게시글 리스트 */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-shimmer rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5">
          <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
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
              <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => navigate("/community")}>
                여행 커뮤니티
              </Button>
            </div>
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
          <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
            <PenSquare className="h-8 w-8 text-primary/40" />
            <div>
              <p className="text-body-sm font-semibold text-foreground">
                {searchQuery ? "검색 결과가 없습니다" : "아직 글이 없어요"}
              </p>
              <p className="mt-1 text-body-sm text-muted-foreground">
                {searchQuery ? "다른 검색어로 시도해보세요" : "첫 번째 글을 작성해보세요!"}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={handleCreateClick} className="mt-2 gap-2 rounded-xl">
                <PenSquare className="h-4 w-4" /> 글쓰기
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* 테이블 헤더 (데스크톱) */}
          <div className="hidden sm:flex items-center gap-3 border-b border-border bg-muted/50 px-5 py-2.5 text-body-sm font-medium text-muted-foreground">
            <span className="flex-1">제목</span>
            <span className="w-28 text-center">작성자</span>
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
                className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 transition-colors hover:bg-muted/50 ${
                  idx > 0 ? "border-t border-border/60" : ""
                } ${isBest ? "bg-warning/5" : ""}`}
              >
                {/* 베스트 뱃지 */}
                {isBest && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-warning px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">
                    <Trophy className="h-2.5 w-2.5" />
                  </span>
                )}

                {/* 제목 + 모바일 메타 */}
                <div
                  className="min-w-0 flex-1"
                  onMouseMove={(e) => handleTitleMouseMove(e, post)}
                  onMouseLeave={handleTitleMouseLeave}
                >
                  <p className="truncate text-sm font-medium">
                    {post.title}
                    {hasImage && <ImageIcon className="ml-1 inline h-3 w-3 text-muted-foreground" />}
                    {post.comments_count > 0 && (
                      <span className="ml-1.5 text-xs text-primary font-semibold">[{post.comments_count}]</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1 sm:hidden text-xs text-muted-foreground">
                    <button
                      onClick={(e) => handleAuthorClick(e, post)}
                      className="hover:text-primary hover:underline"
                    >
                      {profile?.nickname ?? "익명"}
                    </button>
                    {profile && <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />}
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {post.likes_count}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>

                {/* 데스크탑 메타 */}
                <div className="hidden sm:flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                  <button
                    onClick={(e) => handleAuthorClick(e, post)}
                    className="flex items-center justify-center gap-1.5 w-28 truncate hover:text-primary transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                        {profile?.nickname?.charAt(0) ?? "?"}
                      </div>
                    )}
                    <span className="truncate">{profile?.nickname ?? "익명"}</span>
                    {profile && <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />}
                  </button>
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
        <div className="mt-8 flex items-center justify-center gap-1.5">
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
                  className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-body-sm font-semibold transition-colors ${
                    page === p
                      ? "bg-primary/10 text-primary"
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

    </div>
    </div>
    </div>
  )
}
