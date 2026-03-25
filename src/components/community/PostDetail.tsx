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
  RefreshCw,
  PenLine,
  ClipboardList,
  Check,
  SkipForward,
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
import type { CommunityPost, Comment, VoteType } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
import { LevelBadge } from "./LevelBadge"
import { CommentVoteButtons } from "./CommentVoteButtons"
import { TripMetaChips } from "./TripMetaChips"
import { RemixImportModal } from "./RemixImportModal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { cities } from "@/data/cities"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { POST_STAGE_LABELS } from "@/types/community"
import DOMPurify from "dompurify"
import { Star } from "lucide-react"

export function PostDetail() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user, setShowLoginModal, refreshDemoProfile, fetchProfile, profile: authProfile } = useAuthStore()
  const useMock = !isSupabaseConfigured

  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [myVote, setMyVote] = useState<VoteType | null>(null)
  const [commentVotes, setCommentVotes] = useState<Record<string, VoteType | null>>({})
  const [commentText, setCommentText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [votingCommentIds, setVotingCommentIds] = useState<Set<string>>(new Set())
  const [likePopped, setLikePopped] = useState(false)
  const likeBtnRef = useRef<HTMLButtonElement>(null)
  const [confirmDeletePost, setConfirmDeletePost] = useState(false)
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null)
  const [showRemixModal, setShowRemixModal] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 게시글 로드
  const fetchPost = useCallback(async () => {
    if (!postId) {
      setIsLoading(false)
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setFetchError(null)

    if (useMock) {
      setPost(fetchMockPost(postId))
      setIsLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .eq("id", postId)
        .abortSignal(controller.signal)
        .single()

      if (error) {
        console.error("게시글 로드 실패:", error)
        setFetchError("게시글을 불러오지 못했어요")
        return
      }
      if (data) {
        setPost(normalizeCommunityPost(data as CommunityPost))
      }
    } catch (e) {
      if (controller.signal.aborted) return
      console.error("게시글 로드 실패:", e)
      setFetchError("게시글을 불러오지 못했어요")
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
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
    return () => { abortRef.current?.abort() }
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
      showToast("투표 처리에 실패했어요. 잠시 후 다시 시도해주세요.")
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

    await supabase.rpc("add_comment", {
      p_post_id: postId,
      p_user_id: user.id,
      p_content: trimmed,
    })

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

  // 일정 가져오기 → RemixImportModal로 대체
  const handleImportClick = () => {
    if (!post?.trip_data?.days?.length) return
    setShowRemixModal(true)
  }

  // 글 삭제 (본인 또는 관리자)
  const handleDeletePost = async () => {
    if (!postId) return
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
        console.error("댓글 투표 처리 실패:", error)
        showToast("투표 처리에 실패했어요. 잠시 후 다시 시도해주세요.")
        setCommentVotes((prev) => ({ ...prev, [commentId]: prevVote }))
        void fetchComments()
        return
      }

      const result = data?.[0] as { vote_type: VoteType | null; likes_count: number; dislikes_count: number } | undefined
      if (!result) return

      setCommentVotes((prev) => ({ ...prev, [commentId]: result.vote_type }))
      setComments((prev) => prev.map((comment) => comment.id === commentId ? {
        ...comment,
        likes_count: Number(result.likes_count) || 0,
        dislikes_count: Number(result.dislikes_count) || 0,
      } : comment))
    }).catch((err) => {
      console.error("댓글 투표 처리 실패:", err)
      showToast("투표 처리에 실패했어요. 잠시 후 다시 시도해주세요.")
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
      <div className="mx-auto max-w-3xl px-5 pt-24 lg:px-8">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-24 text-center lg:px-8">
        <p className="text-lg font-semibold">{fetchError}</p>
        <p className="mt-1 text-sm text-muted-foreground">네트워크 상태를 확인하고 다시 시도해주세요</p>
        <Button onClick={fetchPost} variant="outline" className="mt-4 gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> 다시 시도
        </Button>
        <div className="mt-2">
          <Link to="/community" className="text-sm text-primary underline">
            커뮤니티로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-24 text-center lg:px-8">
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
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-14 lg:px-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate(post.board_type === "free" ? "/community/free" : "/community")
          }
        }}
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
        <h1 className="text-headline font-bold">{post.title}</h1>
        {post.likes_count >= BEST_THRESHOLD && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
            <Trophy className="h-3 w-3" /> 베스트
          </span>
        )}
        {post.travel_post_stage && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            post.travel_post_stage === "review"
              ? "bg-success/10 text-success"
              : "bg-indigo/10 text-indigo"
          }`}>
            {post.travel_post_stage === "review" ? <PenLine className="h-3 w-3" /> : <ClipboardList className="h-3 w-3" />} {POST_STAGE_LABELS[post.travel_post_stage]}
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

      {/* 여행 메타데이터 */}
      {post.trip_meta && (
        <div className="mb-4">
          <TripMetaChips meta={post.trip_meta} />
        </div>
      )}

      {/* 설명 */}
      {post.description && (
        <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>
      )}

      {/* 후기 데이터 */}
      {post.travel_post_stage === "review" && post.review_data && (
        <div className="mb-6 rounded-2xl border border-success/20 bg-success/5 p-4">
          <h3 className="mb-3 font-semibold text-sm inline-flex items-center gap-1.5"><PenLine className="h-3.5 w-3.5" /> 여행 후기</h3>
          <div className="space-y-2">
            {post.review_data.overallRating != null && post.review_data.overallRating > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">만족도</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`h-4 w-4 ${n <= post.review_data!.overallRating! ? "fill-star text-star" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
            )}
            {post.review_data.actualCost != null && post.review_data.actualCost > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">실제 비용</span>
                <span className="font-bold">¥{post.review_data.actualCost.toLocaleString()}</span>
              </div>
            )}
            {post.review_data.tips && (
              <div className="text-xs">
                <span className="text-muted-foreground">팁</span>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white/60 px-3 py-2 dark:bg-black/20">{post.review_data.tips}</p>
              </div>
            )}
            {post.review_data.visitedPlaceIds && post.review_data.visitedPlaceIds.length > 0 && (
              <div className="text-xs">
                <span className="text-success font-medium inline-flex items-center gap-1"><Check className="h-3 w-3" /> 방문 {post.review_data.visitedPlaceIds.length}곳</span>
                {post.review_data.skippedPlaceIds && post.review_data.skippedPlaceIds.length > 0 && (
                  <span className="ml-2 text-destructive font-medium inline-flex items-center gap-1"><SkipForward className="h-3 w-3" /> 스킵 {post.review_data.skippedPlaceIds.length}곳</span>
                )}
              </div>
            )}
          </div>
        </div>
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
            onClick={handleImportClick}
            className="ml-auto gap-1.5 rounded-xl"
            size="sm"
          >
            <Download className="h-4 w-4" />
            가져오기 / 리믹스
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
              onClick={() => setConfirmDeletePost(true)}
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
              <div key={comment.id} className={`rounded-xl p-3 ${isBestComment ? "bg-warning/5 border border-warning/20" : "bg-muted/50"}`}>
                <div className="mb-1 flex items-center gap-2">
                  {isBestComment && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-warning"><Trophy className="h-3 w-3" /> 베스트</span>
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
                      onClick={() => setConfirmDeleteCommentId(comment.id)}
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

      {/* 게시글 삭제 확인 */}
      <ConfirmDialog
        open={confirmDeletePost}
        onOpenChange={setConfirmDeletePost}
        title="게시글을 삭제하시겠습니까?"
        description="삭제된 게시글은 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDeletePost}
      />

      {/* 리믹스/가져오기 모달 */}
      {post.trip_data && (
        <RemixImportModal
          open={showRemixModal}
          onClose={() => setShowRemixModal(false)}
          post={post}
        />
      )}

      {/* 댓글 삭제 확인 */}
      <ConfirmDialog
        open={!!confirmDeleteCommentId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteCommentId(null) }}
        title="댓글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={async () => {
          const cid = confirmDeleteCommentId
          if (!cid || !postId) return
          if (useMock) {
            deleteMockComment(cid, postId)
            setComments(fetchMockComments(postId))
            setPost(fetchMockPost(postId))
            return
          }
          await supabase.rpc("delete_comment", { p_comment_id: cid, p_post_id: postId })
          fetchComments()
          fetchPost()
        }}
      />
    </div>
  )
}
