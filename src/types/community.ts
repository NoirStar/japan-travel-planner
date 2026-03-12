import type { Trip } from "./schedule"

// ─── 포인트 시스템 ──────────────────────────────────────
export const POINTS = {
  ATTENDANCE: 1,
  COMMENT: 1,
  POST: 3,
  LIKE_RECEIVED: 10,
} as const

// ─── 유저 레벨 ──────────────────────────────────────────
export interface UserLevel {
  level: number
  label: string
  emoji: string
  minPoints: number
}

export const USER_LEVELS: UserLevel[] = [
  { level: 1,  label: "새싹",     emoji: "🌱", minPoints: 0 },
  { level: 2,  label: "지도",     emoji: "🗺️", minPoints: 10 },
  { level: 3,  label: "나침반",   emoji: "🧭", minPoints: 25 },
  { level: 4,  label: "여권",     emoji: "📘", minPoints: 50 },
  { level: 5,  label: "배낭",     emoji: "🎒", minPoints: 80 },
  { level: 6,  label: "기차",     emoji: "🚃", minPoints: 120 },
  { level: 7,  label: "신칸센",   emoji: "🚄", minPoints: 170 },
  { level: 8,  label: "온천",     emoji: "♨️", minPoints: 230 },
  { level: 9,  label: "사쿠라",   emoji: "🌸", minPoints: 300 },
  { level: 10, label: "도리이",   emoji: "⛩️", minPoints: 380 },
  { level: 11, label: "성",       emoji: "🏯", minPoints: 470 },
  { level: 12, label: "마츠리",   emoji: "🏮", minPoints: 580 },
  { level: 13, label: "사무라이", emoji: "⚔️", minPoints: 700 },
  { level: 14, label: "닌자",     emoji: "🥷", minPoints: 840 },
  { level: 15, label: "용",       emoji: "🐉", minPoints: 1000 },
  { level: 16, label: "후지산",   emoji: "🗻", minPoints: 1180 },
  { level: 17, label: "오로라",   emoji: "🌌", minPoints: 1380 },
  { level: 18, label: "왕관",     emoji: "👑", minPoints: 1600 },
  { level: 19, label: "다이아",   emoji: "💎", minPoints: 1850 },
  { level: 20, label: "전설",     emoji: "✨", minPoints: 2100 },
]

export function getLevelInfo(level: number): UserLevel {
  return USER_LEVELS[Math.min(level, USER_LEVELS.length) - 1] ?? USER_LEVELS[0]
}

/** 포인트로 레벨 계산 */
export function calculateLevel(totalPoints: number): number {
  let lv = 1
  for (const ul of USER_LEVELS) {
    if (totalPoints >= ul.minPoints) lv = ul.level
  }
  return lv
}

// ─── 프로필 ─────────────────────────────────────────────
export interface UserProfile {
  id: string
  nickname: string
  avatar_url: string | null
  total_likes: number
  total_points: number
  level: number
  is_admin: boolean
  created_at: string
  updated_at: string
}

// ─── 커뮤니티 게시글 ────────────────────────────────────
export type BoardType = "travel" | "free"

export interface CommunityPost {
  id: string
  user_id: string
  board_type?: BoardType
  title: string
  description: string | null
  content?: string | null
  city_id: string
  cover_image: string | null
  trip_data: Trip | null
  likes_count: number
  dislikes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  // join
  profiles?: UserProfile | UserProfile[]
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

export interface CommentVote {
  id: string
  comment_id: string
  user_id: string
  vote_type: VoteType
  created_at: string
}

export const BEST_THRESHOLD = 5

// ─── 댓글 ───────────────────────────────────────────────
export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  likes_count: number
  dislikes_count: number
  created_at: string
  // join
  profiles?: UserProfile | UserProfile[]
}

// ─── 정렬 옵션 ──────────────────────────────────────────
export type PostSortOption = "latest" | "popular" | "best"

// ─── 알림 ───────────────────────────────────────────────
export type NotificationType = "comment" | "like"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  post_id: string
  post_title: string
  actor_nickname: string
  read: boolean
  created_at: string
}

// ─── 문의 ───────────────────────────────────────────────
export type InquiryCategory = "bug" | "feature" | "question" | "other"
export type InquiryStatus = "open" | "resolved" | "closed"

export interface Inquiry {
  id: string
  user_id: string
  category: InquiryCategory
  title: string
  content: string
  status: InquiryStatus
  admin_reply: string | null
  created_at: string
  // join
  profiles?: UserProfile | UserProfile[]
}
