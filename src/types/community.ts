import type { Trip } from "./schedule"

// ─── 유저 레벨 ──────────────────────────────────────────
export interface UserLevel {
  level: number
  label: string
  emoji: string
  minLikes: number
}

export const USER_LEVELS: UserLevel[] = [
  { level: 1, label: "새싹", emoji: "🌱", minLikes: 0 },
  { level: 2, label: "사쿠라", emoji: "🌸", minLikes: 5 },
  { level: 3, label: "별", emoji: "⭐", minLikes: 20 },
  { level: 4, label: "왕관", emoji: "👑", minLikes: 50 },
]

export function getLevelInfo(level: number): UserLevel {
  return USER_LEVELS[level - 1] ?? USER_LEVELS[0]
}

// ─── 프로필 ─────────────────────────────────────────────
export interface UserProfile {
  id: string
  nickname: string
  avatar_url: string | null
  total_likes: number
  level: number
  created_at: string
  updated_at: string
}

// ─── 커뮤니티 게시글 ────────────────────────────────────
export interface CommunityPost {
  id: string
  user_id: string
  title: string
  description: string | null
  city_id: string
  cover_image: string | null
  trip_data: Trip
  likes_count: number
  dislikes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  // join
  profiles?: UserProfile
}

// ─── 투표 ───────────────────────────────────────────────
export type VoteType = "up" | "down"

export interface PostVote {
  id: string
  post_id: string
  user_id: string
  vote_type: VoteType
  created_at: string
}

// ─── 댓글 ───────────────────────────────────────────────
export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  // join
  profiles?: UserProfile
}

// ─── 정렬 옵션 ──────────────────────────────────────────
export type PostSortOption = "latest" | "popular"
