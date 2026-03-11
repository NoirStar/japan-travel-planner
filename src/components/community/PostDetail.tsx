import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ArrowLeft,
  MapPin,
  Download,
  Send,
  Trash2,
  Trophy,
  Calendar,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import {
  fetchMockPost,
  fetchMockComments,
  getMockVote,
  toggleMockVote,
  addMockComment,
  deleteMockComment,
  deleteMockPost,
  getMockCommentVote,
  toggleMockCommentVote,
} from "@/lib/mockCommunity"
import { createNotification } from "@/lib/notificationService"
import { normalizeComment, normalizeCommunityPost, unwrapProfile } from "@/lib/communityTransforms"
import { useAuthStore } from "@/stores/authStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import type { CommunityPost, Comment, VoteType } from "@/types/community"
import type { Place } from "@/types/place"
import { BEST_THRESHOLD } from "@/types/community"
import { LevelBadge } from "./LevelBadge"
import { CommentVoteButtons } from "./CommentVoteButtons"
import { cities } from "@/data/cities"
import { showToast } from "@/components/ui/CelebrationOverlay"
import DOMPurify from "dompurify"

export function PostDetail() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user, setShowLoginModal, refreshDemoProfile, fetchProfile, profile: authProfile } = useAuthStore()
  const { createTrip, addDay, addItem } = useScheduleStore()
  const useMock = !isSupabaseConfigured

  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [myVote, setMyVote] = useState<VoteType | null>(null)
  const [commentVotes, setCommentVotes] = useState<Record<string, VoteType | null>>({})
  const [commentText, setCommentText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [votingCommentIds, setVotingCommentIds] = useState<Set<string>>(new Set())
  const [likePopped, setLikePopped] = useState(false)
  const likeBtnRef = useRef<HTMLButtonElement>(null)

  // 게시글 로드
  const fetchPost = useCallback(async () => {
    if (!postId) return
    if (useMock) {
      setPost(fetchMockPost(postId))
      setIsLoading(false)
      return
    }
    try {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .eq("id", postId)
        .single()

      if (data) {
        setPost(normalizeCommunityPost(data as CommunityPost))
      }
    } catch (e) {
      console.error("게시글 로드 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [postId, useMock])

  // 댓글 로드
  const fetchComments = useCallback(async () => {
    if (!postId) return
    if (useMock) {
      setComments(fetchMockComments(postId))
      return
    }
    try {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      setComments(((data as Comment[]) ?? []).map(normalizeComment))
    } catch (e) {
      console.error("댓글 로드 실패:", e)
    }
  }, [postId, useMock])

  // 내 투표 상태 확인
  const fetchMyVote = useCallback(async () => {
    if (!postId || !user) return
    if (useMock) {
      setMyVote(getMockVote(postId, user.id))
      return
    }
    const { data } = await supabase
      .from("post_votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    setMyVote((data?.vote_type as VoteType) ?? null)
  }, [postId, user, useMock])

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [fetchPost, fetchComments])

  useEffect(() => {
    fetchMyVote()
  }, [fetchMyVote])

  useEffect(() => {
    if (!user || comments.length === 0) {
      setCommentVotes({})
      return
    }

    if (useMock) {
      const votes: Record<string, VoteType | null> = {}
      for (const c of comments) {
        votes[c.id] = getMockCommentVote(c.id, user.id)
      }
      setCommentVotes(votes)
      return
    }

    void supabase
      .from("comment_votes")
      .select("comment_id, vote_type")
      .eq("user_id", user.id)
      .in("comment_id", comments.map((comment) => comment.id))
      .then(({ data }) => {
        const nextVotes: Record<string, VoteType | null> = {}
        for (const comment of comments) {
          nextVotes[comment.id] = null
        }
        for (const vote of data ?? []) {
          nextVotes[vote.comment_id] = vote.vote_type as VoteType
        }
        setCommentVotes(nextVotes)
      })
  }, [comments, user, useMock])

  // 추천/비추천 (optimistic UI + 중복 클릭 방지)
  const handleVote = async (type: VoteType) => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    if (!postId || isVoting) return

    setIsVoting(true)

    if (useMock) {
      const newVote = toggleMockVote(postId, user.id, type)
      setMyVote(newVote)
      setPost(fetchMockPost(postId))
      setTimeout(() => refreshDemoProfile(), 0)
      if (type === "up" && newVote === "up") {
        setLikePopped(true)
        setTimeout(() => setLikePopped(false), 500)
      }
      setIsVoting(false)
      return
    }

    // Optimistic update
    const prevVote = myVote
    const prevPost = post ? { ...post } : null
    const isCancelling = myVote === type

    setMyVote(isCancelling ? null : type)
    if (post) {
      const updated = { ...post }
      if (isCancelling) {
        if (type === "up") updated.likes_count = Math.max(0, (updated.likes_count ?? 0) - 1)
        else updated.dislikes_count = Math.max(0, (updated.dislikes_count ?? 0) - 1)
      } else {
        if (myVote && myVote !== type) {
          if (myVote === "up") updated.likes_count = Math.max(0, (updated.likes_count ?? 0) - 1)
          else updated.dislikes_count = Math.max(0, (updated.dislikes_count ?? 0) - 1)
        }
        if (type === "up") updated.likes_count = (updated.likes_count ?? 0) + 1
        else updated.dislikes_count = (updated.dislikes_count ?? 0) + 1
      }
      setPost(updated)
    }

    try {
      const { data, error } = await supabase.rpc("toggle_post_vote", {
        p_post_id: postId,
        p_vote_type: type,
      })

      if (error) {
        throw error
      }

      const result = data?.[0] as { vote_type: VoteType | null; likes_count: number; dislikes_count: number } | undefined
      if (result) {
        setMyVote(result.vote_type)
        setPost((current) => current ? {
          ...current,
          likes_count: Number(result.likes_count) || 0,
          dislikes_count: Number(result.dislikes_count) || 0,
        } : current)

        // 투표 후 프로필 갱신 (레벨/포인트 반영)
        if (user) void fetchProfile(user.id)

        if (type === "up" && result.vote_type === "up" && post && post.user_id !== user.id && authProfile?.nickname) {
          void createNotification({
            userId: post.user_id,
            type: "like",
            postId,
            postTitle: post.title,
            actorNickname: authProfile.nickname,
          })
        }
      }
    } catch (err) {
      console.error("투표 처리 실패:", err)
      showToast("투표 처리에 실패했어요")
      setMyVote(prevVote)
      if (prevPost) setPost(prevPost)
    } finally {
      setIsVoting(false)
    }
  }

  // 댓글 작성
  const handleComment = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    const trimmed = commentText.trim()
    if (!trimmed || !postId) return
    setIsSending(true)

    if (useMock) {
      addMockComment(postId, user.id, trimmed)
      setCommentText("")
      setIsSending(false)
      setComments(fetchMockComments(postId))
      setPost(fetchMockPost(postId))
      refreshDemoProfile()
      return
    }

    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: trimmed,
    })

    // 댓글 수 증가
    await supabase.rpc("increment_count", { row_id: postId, col_name: "comments_count" })

    if (post && post.user_id !== user.id && authProfile?.nickname) {
      void createNotification({
        userId: post.user_id,
        type: "comment",
        postId,
        postTitle: post.title,
        actorNickname: authProfile.nickname,
      })
    }

    setCommentText("")
    setIsSending(false)
    fetchComments()
    fetchPost()
  }

  // 일정 가져오기
  const handleImport = () => {
    if (!post?.trip_data?.days?.length) return
    const tripData = post.trip_data
    const newTrip = createTrip(tripData.cityId, `[가져옴] ${post.title}`)

    // trip_data에 포함된 장소 데이터를 dynamicPlaceStore에 복원
    const { addPlace } = useDynamicPlaceStore.getState()
    for (const day of tripData.days ?? []) {
      for (const item of day.items ?? []) {
        if ((item as unknown as { placeData?: Place }).placeData) {
          addPlace((item as unknown as { placeData: Place }).placeData)
        }
      }
    }

    // 기존 Day 하나 제거 후 원본 일정 복제
    ;(tripData.days ?? []).forEach((day, i) => {
      const newDay = i === 0 ? newTrip.days[0] : addDay(newTrip.id)
      ;(day.items ?? []).forEach((item) => {
        addItem(newTrip.id, newDay.id, item.placeId)
      })
    })

    navigate("/planner")
  }

  // 글 삭제 (본인 또는 관리자)
  const handleDeletePost = async () => {
    if (!postId) return
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return
    const backTo = post?.board_type === "free" ? "/community/free" : "/community"
    if (useMock) {
      deleteMockPost(postId)
      navigate(backTo)
      return
    }
    await supabase.from("comments").delete().eq("post_id", postId)
    await supabase.from("post_votes").delete().eq("post_id", postId)
    await supabase.from("posts").delete().eq("id", postId)
    navigate(backTo)
  }

  // 댓글 투표
  const handleCommentVote = (commentId: string, type: VoteType) => {
    if (!user) { setShowLoginModal(true); return }
    if (votingCommentIds.has(commentId)) return

    setVotingCommentIds((prev) => new Set(prev).add(commentId))

    if (useMock) {
      const newVote = toggleMockCommentVote(commentId, user.id, type)
      setCommentVotes((prev) => ({ ...prev, [commentId]: newVote }))
      setComments(fetchMockComments(postId!))
      setVotingCommentIds((prev) => { const next = new Set(prev); next.delete(commentId); return next })
      return
    }

    const prevVote = commentVotes[commentId] ?? null
    const isCancelling = prevVote === type
    const nextVote = isCancelling ? null : type

    setCommentVotes((prev) => ({ ...prev, [commentId]: nextVote }))
    setComments((prev) => prev.map((comment) => {
      if (comment.id !== commentId) return comment
      let likes = comment.likes_count ?? 0
      let dislikes = comment.dislikes_count ?? 0

      if (isCancelling) {
        if (type === "up") likes = Math.max(0, likes - 1)
        else dislikes = Math.max(0, dislikes - 1)
      } else {
        if (prevVote === "up") likes = Math.max(0, likes - 1)
        if (prevVote === "down") dislikes = Math.max(0, dislikes - 1)
        if (type === "up") likes += 1
        else dislikes += 1
      }

      return {
        ...comment,
        likes_count: likes,
        dislikes_count: dislikes,
      }
    }))

    const request = supabase.rpc("toggle_comment_vote", {
      p_comment_id: commentId,
      p_vote_type: type,
    })

    void Promise.resolve(request).then(({ data, error }) => {
      if (error) {
        throw error
      }

      const result = data?.[0] as { vote_type: VoteType | null; likes_count: number; dislikes_count: number } | undefined
      if (!result) return

      setCommentVotes((prev) => ({ ...prev, [commentId]: result.vote_type }))
      setComments((prev) => prev.map((comment) => comment.id === commentId ? {
        ...comment,
        likes_count: Number(result.likes_count) || 0,
        dislikes_count: Number(result.dislikes_count) || 0,
      } : comment))
    }, (err) => {
      console.error("댓글 투표 처리 실패:", err)
      showToast("투표 처리에 실패했어요")
      setCommentVotes((prev) => ({ ...prev, [commentId]: prevVote }))
      void fetchComments()
    }).finally(() => {
      setVotingCommentIds((prev) => { const next = new Set(prev); next.delete(commentId); return next })
    })
  }

  // 베스트 댓글 먼저 정렬 (메모이제이션)
  const sortedComments = useMemo(() => [...comments].sort((a, b) => {
    const aBest = (a.likes_count ?? 0) >= BEST_THRESHOLD ? 1 : 0
    const bBest = (b.likes_count ?? 0) >= BEST_THRESHOLD ? 1 : 0
    if (bBest !== aBest) return bBest - aBest
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  }), [comments])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-20 text-center">
        <p className="text-lg font-semibold">게시글을 찾을 수 없습니다</p>
        <Link to="/community" className="mt-2 text-sm text-primary underline">
          커뮤니티로 돌아가기
        </Link>
      </div>
    )
  }

  const profile = unwrapProfile(post.profiles)
  const city = cities.find((c) => c.id === post.city_id)
  const dayCount = post.trip_data?.days?.length ?? 0

  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-10">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(post.board_type === "free" ? "/community/free" : "/community")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {post.board_type === "free" ? "자유게시판" : "여행 공유"}
      </button>

      {/* 커버 */}
      {(post.cover_image || (post.board_type !== "free" && city?.image)) && (
        <div className="mb-4 h-48 overflow-hidden rounded-2xl bg-muted">
          <img
            src={post.cover_image ?? city?.image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* 제목 + 메타 */}
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        {post.likes_count >= BEST_THRESHOLD && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <Trophy className="h-3 w-3" /> 베스트
          </span>
        )}
      </div>
      {post.board_type !== "free" ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {city?.name ?? post.city_id}
          </span>
          <span>·</span>
          <span>{dayCount}일 일정</span>
          <span>·</span>
          <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
        </div>
      ) : (
        <div className="mb-4 text-sm text-muted-foreground">
          {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      )}

      {/* 작성자 */}
      {profile && (
        <div className="mb-4 flex items-center gap-2">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {profile.nickname.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium">{profile.nickname}</span>
          <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />
        </div>
      )}

      {/* 설명 */}
      {post.description && (
        <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>
      )}

      {/* 본문 (free board) */}
      {post.board_type === "free" && post.content && (
        <div
          className="mb-6 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, { ADD_TAGS: ["img"], ADD_ATTR: ["src", "alt", "style"] }) }}
        />
      )}

      {/* 일정 미리보기 (travel only) */}
      {post.board_type !== "free" && post.trip_data && (
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 일정 미리보기</h3>
        <div className="space-y-3">
          {(post.trip_data?.days ?? []).map((day) => (
            <div key={day.id ?? String(day.dayNumber)} className="rounded-xl bg-muted/50 p-3">
              <p className="mb-1 text-xs font-semibold text-primary">
                Day {String(day.dayNumber)}{day.date && ` · ${String(day.date)}`}
              </p>
              {!day.items || day.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">일정이 비어있습니다</p>
              ) : (
                <ul className="space-y-1">
                  {day.items.map((item, idx) => (
                    <li key={item.id ?? idx} className="text-xs text-muted-foreground">
                      {idx + 1}. {String(item.placeName ?? item.placeId ?? "")}
                      {item.startTime && typeof item.startTime === "string" && <span className="ml-1 text-primary">({item.startTime})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* 액션 버튼 */}
      <div className="mb-6 flex items-center gap-2">
        <Button
          ref={likeBtnRef}
          variant={myVote === "up" ? "default" : "outline"}
          onClick={() => handleVote("up")}
          className={`gap-1.5 rounded-xl ${likePopped ? "animate-like-pop" : ""}`}
          size="sm"
        >
          <ThumbsUp className="h-4 w-4" />
          추천 {Number(post.likes_count) || 0}
        </Button>
        <Button
          variant={myVote === "down" ? "destructive" : "outline"}
          onClick={() => handleVote("down")}
          className="gap-1.5 rounded-xl"
          size="sm"
        >
          <ThumbsDown className="h-4 w-4" />
          {Number(post.dislikes_count) || 0}
        </Button>
        {post.board_type !== "free" && (
          <Button
            variant="outline"
            onClick={handleImport}
            className="ml-auto gap-1.5 rounded-xl"
            size="sm"
          >
            <Download className="h-4 w-4" />
            내 일정으로 가져오기
          </Button>
        )}
        {(authProfile?.is_admin || user?.id === post.user_id) && (
          <>
            {user?.id === post.user_id && post.board_type === "free" && (
              <Button
                variant="outline"
                onClick={() => navigate(`/community/free/edit/${postId}`)}
                className="gap-1.5 rounded-xl"
                size="sm"
              >
                <Pencil className="h-4 w-4" />
                수정
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              className="gap-1.5 rounded-xl"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </>
        )}
      </div>

      {/* 댓글 */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-1.5 font-semibold">
          <MessageCircle className="h-4 w-4" />
          댓글 {comments.length}
        </h3>

        {/* 댓글 입력 */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleComment()
              }
            }}
            placeholder={user ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
            maxLength={500}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            onClick={handleComment}
            disabled={isSending || !commentText.trim()}
            size="icon"
            className="shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* 댓글 목록 */}
        {sortedComments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
          </p>
        ) : (
          <div className="space-y-3">
            {sortedComments.map((comment) => {
              const isBestComment = (comment.likes_count ?? 0) >= BEST_THRESHOLD
              return (
              <div key={comment.id} className={`rounded-xl p-3 ${isBestComment ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" : "bg-muted/50"}`}>
                <div className="mb-1 flex items-center gap-2">
                  {isBestComment && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400"><Trophy className="h-3 w-3" /> 베스트</span>
                  )}
                  {(() => {
                    const cp = unwrapProfile(comment.profiles)
                    return <>
                      {cp?.avatar_url ? (
                        <img src={cp.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                          {cp?.nickname?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <span className="text-xs font-medium">{cp?.nickname ?? "익명"}</span>
                      {cp && (
                        <LevelBadge level={cp.level} totalPoints={cp.total_points} isAdmin={cp.is_admin} compact />
                      )}
                    </>
                  })()}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {(user?.id === comment.user_id || authProfile?.is_admin) && (
                    <button
                      onClick={async () => {
                        if (!window.confirm("댓글을 삭제하시겠습니까?")) return
                        if (useMock) {
                          deleteMockComment(comment.id, postId!)
                          setComments(fetchMockComments(postId!))
                          setPost(fetchMockPost(postId!))
                          return
                        }
                        await supabase.from("comments").delete().eq("id", comment.id)
                        await supabase.rpc("decrement_count", { row_id: postId!, col_name: "comments_count" })
                        fetchComments()
                        fetchPost()
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      title={authProfile?.is_admin ? "관리자 삭제" : "삭제"}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="mb-2 text-sm leading-relaxed">{comment.content}</p>
                {/* 댓글 투표 */}
                <CommentVoteButtons
                  commentId={comment.id}
                  likesCount={Number(comment.likes_count) || 0}
                  dislikesCount={Number(comment.dislikes_count) || 0}
                  currentVote={commentVotes[comment.id]}
                  onVote={handleCommentVote}
                />
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
