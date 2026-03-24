import { ThumbsUp, MessageCircle, MapPin, Trophy, PenLine } from "lucide-react"
import { Link } from "react-router-dom"
import type { CommunityPost } from "@/types/community"
import { BEST_THRESHOLD } from "@/types/community"
import { unwrapProfile } from "@/lib/communityTransforms"
import { LevelBadge } from "./LevelBadge"
import { TripMetaChips } from "./TripMetaChips"
import { cities } from "@/data/cities"

interface PostCardProps {
  post: CommunityPost
}

export function PostCard({ post }: PostCardProps) {
  const city = cities.find((c) => c.id === post.city_id)
  const dayCount = post.trip_data?.days?.length ?? 0
  const profile = unwrapProfile(post.profiles)

  return (
    <Link
      to={`/community/${post.id}`}
      className={`group block overflow-hidden rounded-2xl border card-shadow bg-card transition-all hover:border-primary/30 ${
        post.likes_count >= BEST_THRESHOLD
          ? "border-amber-400/60 dark:border-amber-600/50 ring-1 ring-amber-200/30 dark:ring-amber-700/20"
          : "border-border"
      }`}
    >
      {/* 커버 이미지 */}
      <div className="relative h-44 overflow-hidden bg-muted">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        ) : city?.image ? (
          <img
            src={city.image}
            alt={city.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <MapPin className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* 하단 그라데이션 오버레이 */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* 도시 + 일수 배지 */}
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
        {post.likes_count >= BEST_THRESHOLD && (
          <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-white">
            <Trophy className="h-3 w-3" /> 베스트
          </div>
        )}
        {post.travel_post_stage === "review" && (
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[11px] font-bold text-white">
            <PenLine className="h-3 w-3" /> 후기
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.description && (
          <p className="mb-2.5 line-clamp-2 text-body-sm leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        )}

        {post.trip_meta && (
          <div className="mb-2">
            <TripMetaChips meta={post.trip_meta} compact />
          </div>
        )}

        {/* 하단 정보 */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
          <div className="flex items-center gap-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-border" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold ring-1 ring-border">
                {profile?.nickname?.charAt(0) ?? "?"}
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {profile?.nickname ?? "익명"}
            </span>
            {profile && <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {Number(post.likes_count) || 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {Number(post.comments_count) || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
