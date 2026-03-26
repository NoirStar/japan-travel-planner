import { ThumbsUp, MessageCircle, MapPin, Trophy, PenLine, Clock } from "lucide-react"
import { Link } from "react-router-dom"
import type { CommunityPost } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
import { unwrapProfile } from "@/lib/communityTransforms"
import { cities } from "@/data/cities"

interface PostCardProps {
  post: CommunityPost
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const d = new Date(dateStr).getTime()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "방금"
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  const months = Math.floor(days / 30)
  return `${months}개월 전`
}

export function PostCard({ post }: PostCardProps) {
  const city = cities.find((c) => c.id === post.city_id)
  const dayCount = post.trip_data?.days?.length ?? 0
  const profile = unwrapProfile(post.profiles)
  const isBest = post.likes_count >= BEST_THRESHOLD

  return (
    <Link
      to={`/community/${post.id}`}
      className={`group block overflow-hidden rounded-xl border card-shadow bg-card transition-all hover:border-primary/30 ${
        isBest ? "border-warning/40 ring-1 ring-warning/15" : "border-border"
      }`}
    >
      {/* 커버 이미지 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
        ) : city?.image ? (
          <img src={city.image} alt={city.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <MapPin className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* 배지 */}
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white/90">
            <MapPin className="h-3 w-3" />
            {city?.name ?? post.city_id}
          </span>
          {dayCount > 0 && (
            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white/90">
              {dayCount}일
            </span>
          )}
        </div>
        {isBest && (
          <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-warning/90 px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
            <Trophy className="h-3 w-3" /> 베스트
          </div>
        )}
        {post.travel_post_stage === "review" && (
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[11px] font-bold text-success-foreground">
            <PenLine className="h-3 w-3" /> 후기
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-3">
        <h3 className="mb-1 line-clamp-1 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* 설명 미리보기 */}
        {post.description && (
          <p className="mb-2 line-clamp-1 text-[11px] text-muted-foreground leading-relaxed">
            {post.description}
          </p>
        )}

        {/* 작성자 + 시간 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                {profile?.nickname?.charAt(0) ?? "?"}
              </div>
            )}
            <span className="text-[11px] text-muted-foreground truncate">
              {profile?.nickname ?? "익명"}
            </span>
            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 shrink-0">
              <Clock className="h-2.5 w-2.5" />
              {timeAgo(post.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
            <span className="inline-flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3" />
              {Number(post.likes_count) || 0}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" />
              {Number(post.comments_count) || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
