import { useState, useEffect, useCallback } from "react"
import { Plus, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockPosts } from "@/lib/mockCommunity"
import { useAuthStore } from "@/stores/authStore"
import type { CommunityPost, PostSortOption } from "@/types/community"
import { PostCard } from "./PostCard"
import { CreatePostModal } from "./CreatePostModal"
import { cities } from "@/data/cities"

export function CommunityPage() {
  const { user, setShowLoginModal } = useAuthStore()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [sort, setSort] = useState<PostSortOption>("latest")
  const [cityFilter, setCityFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)

    if (!isSupabaseConfigured) {
      setPosts(fetchMockPosts(sort, cityFilter))
      setIsLoading(false)
      return
    }

    let query = supabase
      .from("posts")
      .select("*, profiles(*)")

    if (cityFilter) {
      query = query.eq("city_id", cityFilter)
    }

    if (sort === "popular") {
      query = query.order("likes_count", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.limit(50)

    const { data } = await query
    setPosts((data as CommunityPost[]) ?? [])
    setIsLoading(false)
  }, [sort, cityFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

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
          <h1 className="text-2xl font-bold">커뮤니티</h1>
          <p className="text-sm text-muted-foreground">다른 여행자들의 일정을 구경하세요</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">여행 공유</span>
        </Button>
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
      </div>

      {/* 게시글 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-muted" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">🗾</p>
          <p className="mt-2 text-lg font-semibold">아직 공유된 여행이 없어요</p>
          <p className="text-sm text-muted-foreground">첫 번째로 여행을 공유해보세요!</p>
          <Button onClick={handleCreateClick} className="mt-4 gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            여행 공유하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 글쓰기 모달 */}
      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchPosts}
      />
    </div>
  )
}
