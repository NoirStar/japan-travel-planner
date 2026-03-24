import { ThumbsUp, MessageCircle, MapPin, Trophy } from "lucide-react"
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
      className={`group block overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg ${
        post.likes_count >= BEST_THRESHOLD
          ? "border-amber-300 dark:border-amber-600 ring-1 ring-amber-200/50 dark:ring-amber-700/30"
          : "border-border hover:border-primary/30"
      }`}
    >
      {/* 커버 이미지 */}
      <div className="relative h-44 overflow-hidden bg-muted">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : city?.image ? (
          <img
            src={city.image}
            alt={city.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <MapPin className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* 하단 그라데이션 오버레이 */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        {/* 도시 + 일수 배지 */}
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="h-3 w-3" />
            {city?.name ?? post.city_id}
          </span>
          {dayCount > 0 && (
            <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {dayCount}일
            </span>
          )}
        </div>
        {post.likes_count >= BEST_THRESHOLD && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
            <Trophy className="h-3 w-3" /> 베스트
          </div>
        )}
        {post.travel_post_stage === "review" && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
            ✍️ 후기
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-3.5">
        <h3 className="mb-1 line-clamp-1 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.description && (
          <p className="mb-2 line-clamp-2 text-body-sm leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        )}

        {post.trip_meta && (
          <div className="mb-2">
            <TripMetaChips meta={post.trip_meta} compact />
          </div>
        )}

        {/* 하단 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
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
