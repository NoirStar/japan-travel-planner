/**
 * localStorage 기반 커뮤니티 Mock — Supabase 미설정 시 데모 모드 지원
 */
import type { CommunityPost, Comment, VoteType, UserProfile } from "@/types/community"
import { calculateLevel, POINTS } from "@/types/community"

const KEYS = {
  posts: "mock_community_posts",
  comments: "mock_community_comments",
  votes: "mock_community_votes",
  commentVotes: "mock_community_comment_votes",
  demoUser: "mock_demo_user",
  pointLog: "mock_point_log",
  lastAttendance: "mock_last_attendance",
  chatMessages: "mock_chat_messages",
} as const

// ─── 유틸 ────────────────────────────────────────────────
function uid(): string {
  return crypto.randomUUID()
}

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]")
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── 포인트 로그 ─────────────────────────────────────────
export type PointAction = "attendance" | "comment" | "post" | "like_received"

interface PointEntry {
  action: PointAction
  points: number
  date: string
}

function addPoints(action: PointAction, pts: number) {
  const log = read<PointEntry>(KEYS.pointLog)
  log.push({ action, points: pts, date: new Date().toISOString() })
  write(KEYS.pointLog, log)
  recalcProfile()
}

export function getPointLog(): PointEntry[] {
  return read<PointEntry>(KEYS.pointLog)
}

export function getPointBreakdown(): Record<PointAction, number> {
  const log = read<PointEntry>(KEYS.pointLog)
  const breakdown: Record<PointAction, number> = { attendance: 0, comment: 0, post: 0, like_received: 0 }
  for (const e of log) {
    breakdown[e.action] = (breakdown[e.action] ?? 0) + e.points
  }
  return breakdown
}

function recalcProfile(): UserProfile {
  const profile = getDemoProfile()
  const log = read<PointEntry>(KEYS.pointLog)
  const totalPoints = log.reduce((sum, e) => sum + e.points, 0)
  // 추천 받은 수도 별도 계산 (likes 기반)
  const posts = read<CommunityPost>(KEYS.posts).filter((p) => p.user_id === DEMO_USER_ID)
  const totalLikes = posts.reduce((sum, p) => sum + p.likes_count, 0)
  const level = calculateLevel(totalPoints)
  const updated = { ...profile, total_points: totalPoints, total_likes: totalLikes, level, updated_at: new Date().toISOString() }
  localStorage.setItem(KEYS.demoUser, JSON.stringify(updated))
  return updated
}

// ─── 출석 체크 ───────────────────────────────────────────
export function checkAttendance(): { success: boolean; alreadyDone: boolean } {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const last = localStorage.getItem(KEYS.lastAttendance)
  if (last === today) return { success: false, alreadyDone: true }
  localStorage.setItem(KEYS.lastAttendance, today)
  addPoints("attendance", POINTS.ATTENDANCE)
  return { success: true, alreadyDone: false }
}

export function hasCheckedInToday(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return localStorage.getItem(KEYS.lastAttendance) === today
}

// ─── 데모 유저 ───────────────────────────────────────────
export const DEMO_USER_ID = "demo-user-0001"
export const ADMIN_USER_ID = "admin-user-0001"

export function getDemoProfile(): UserProfile {
  const stored = localStorage.getItem(KEYS.demoUser)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // 마이그레이션: total_points, is_admin 필드 보장
      if (parsed.total_points === undefined) parsed.total_points = 0
      if (parsed.is_admin === undefined) parsed.is_admin = false
      return parsed
    } catch { /* fallthrough */ }
  }
  const profile: UserProfile = {
    id: DEMO_USER_ID,
    nickname: "タビ旅人",
    avatar_url: null,
    total_likes: 0,
    total_points: 0,
    level: 1,
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  localStorage.setItem(KEYS.demoUser, JSON.stringify(profile))
  return profile
}

export function getAdminProfile(): UserProfile {
  return {
    id: ADMIN_USER_ID,
    nickname: "관리자",
    avatar_url: null,
    total_likes: 0,
    total_points: 99999,
    level: 20,
    is_admin: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function updateDemoProfile(updates: Partial<Pick<UserProfile, "nickname" | "avatar_url">>): UserProfile {
  const profile = getDemoProfile()
  const updated = { ...profile, ...updates, updated_at: new Date().toISOString() }
  localStorage.setItem(KEYS.demoUser, JSON.stringify(updated))
  return updated
}

// ─── 게시글 CRUD ─────────────────────────────────────────
export function fetchMockPosts(sort: "latest" | "popular", cityFilter: string): CommunityPost[] {
  let posts = read<CommunityPost>(KEYS.posts)
  if (cityFilter) posts = posts.filter((p) => p.city_id === cityFilter)
  if (sort === "popular") {
    posts.sort((a, b) => b.likes_count - a.likes_count)
  } else {
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return posts.slice(0, 50)
}

export function fetchMockPost(postId: string): CommunityPost | null {
  return read<CommunityPost>(KEYS.posts).find((p) => p.id === postId) ?? null
}

export function createMockPost(post: Omit<CommunityPost, "id" | "likes_count" | "dislikes_count" | "comments_count" | "created_at" | "updated_at" | "profiles">): CommunityPost {
  const profile = post.user_id === ADMIN_USER_ID ? getAdminProfile() : getDemoProfile()
  const newPost: CommunityPost = {
    ...post,
    id: uid(),
    likes_count: 0,
    dislikes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: profile,
  }
  const posts = read<CommunityPost>(KEYS.posts)
  posts.push(newPost)
  write(KEYS.posts, posts)
  addPoints("post", POINTS.POST)
  return newPost
}

// ─── 투표 ────────────────────────────────────────────────
interface MockVote { post_id: string; user_id: string; vote_type: VoteType }

export function getMockVote(postId: string, userId: string): VoteType | null {
  const votes = read<MockVote>(KEYS.votes)
  return votes.find((v) => v.post_id === postId && v.user_id === userId)?.vote_type ?? null
}

export function toggleMockVote(postId: string, userId: string, type: VoteType): VoteType | null {
  const votes = read<MockVote>(KEYS.votes)
  const posts = read<CommunityPost>(KEYS.posts)
  const post = posts.find((p) => p.id === postId)
  if (!post) return null

  const existingIdx = votes.findIndex((v) => v.post_id === postId && v.user_id === userId)
  const existing = existingIdx >= 0 ? votes[existingIdx] : null

  let newVote: VoteType | null = type

  if (existing?.vote_type === type) {
    votes.splice(existingIdx, 1)
    if (type === "up") post.likes_count = Math.max(0, post.likes_count - 1)
    else post.dislikes_count = Math.max(0, post.dislikes_count - 1)
    newVote = null
  } else {
    if (existing) {
      if (existing.vote_type === "up") post.likes_count = Math.max(0, post.likes_count - 1)
      else post.dislikes_count = Math.max(0, post.dislikes_count - 1)
      votes.splice(existingIdx, 1)
    }
    votes.push({ post_id: postId, user_id: userId, vote_type: type })
    if (type === "up") {
      post.likes_count += 1
      // 글 작성자에게 추천 포인트 (본인 추천 제외)
      if (post.user_id === DEMO_USER_ID && userId !== DEMO_USER_ID) {
        addPoints("like_received", POINTS.LIKE_RECEIVED)
      }
    } else {
      post.dislikes_count += 1
    }
  }

  write(KEYS.votes, votes)
  write(KEYS.posts, posts)
  recalcProfile()
  return newVote
}

// ─── 댓글 ────────────────────────────────────────────────
export function fetchMockComments(postId: string): Comment[] {
  return read<Comment>(KEYS.comments)
    .filter((c) => c.post_id === postId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function addMockComment(postId: string, userId: string, content: string): Comment {
  const profile = userId === ADMIN_USER_ID ? getAdminProfile() : getDemoProfile()
  const comment: Comment = {
    id: uid(),
    post_id: postId,
    user_id: userId,
    content,
    likes_count: 0,
    dislikes_count: 0,
    created_at: new Date().toISOString(),
    profiles: profile,
  }
  const comments = read<Comment>(KEYS.comments)
  comments.push(comment)
  write(KEYS.comments, comments)

  const posts = read<CommunityPost>(KEYS.posts)
  const post = posts.find((p) => p.id === postId)
  if (post) {
    post.comments_count += 1
    write(KEYS.posts, posts)
  }
  addPoints("comment", POINTS.COMMENT)
  return comment
}

export function deleteMockComment(commentId: string, postId: string) {
  const comments = read<Comment>(KEYS.comments)
  const idx = comments.findIndex((c) => c.id === commentId)
  if (idx >= 0) {
    comments.splice(idx, 1)
    write(KEYS.comments, comments)

    const posts = read<CommunityPost>(KEYS.posts)
    const post = posts.find((p) => p.id === postId)
    if (post) {
      post.comments_count = Math.max(0, post.comments_count - 1)
      write(KEYS.posts, posts)
    }
  }
}

// ─── 관리자 삭제 ─────────────────────────────────────────
export function deleteMockPost(postId: string) {
  const posts = read<CommunityPost>(KEYS.posts)
  write(KEYS.posts, posts.filter((p) => p.id !== postId))
  // 관련 댓글, 투표도 삭제
  const comments = read<Comment>(KEYS.comments)
  write(KEYS.comments, comments.filter((c) => c.post_id !== postId))
  const votes = read<MockVote>(KEYS.votes)
  write(KEYS.votes, votes.filter((v) => v.post_id !== postId))
}

// ─── 댓글 투표 ───────────────────────────────────────────
interface MockCommentVote { comment_id: string; user_id: string; vote_type: VoteType }

export function getMockCommentVote(commentId: string, userId: string): VoteType | null {
  const votes = read<MockCommentVote>(KEYS.commentVotes)
  return votes.find((v) => v.comment_id === commentId && v.user_id === userId)?.vote_type ?? null
}

export function toggleMockCommentVote(commentId: string, userId: string, type: VoteType): VoteType | null {
  const votes = read<MockCommentVote>(KEYS.commentVotes)
  const comments = read<Comment>(KEYS.comments)
  const comment = comments.find((c) => c.id === commentId)
  if (!comment) return null

  const existingIdx = votes.findIndex((v) => v.comment_id === commentId && v.user_id === userId)
  const existing = existingIdx >= 0 ? votes[existingIdx] : null
  let newVote: VoteType | null = type

  if (existing?.vote_type === type) {
    votes.splice(existingIdx, 1)
    if (type === "up") comment.likes_count = Math.max(0, comment.likes_count - 1)
    else comment.dislikes_count = Math.max(0, comment.dislikes_count - 1)
    newVote = null
  } else {
    if (existing) {
      if (existing.vote_type === "up") comment.likes_count = Math.max(0, comment.likes_count - 1)
      else comment.dislikes_count = Math.max(0, comment.dislikes_count - 1)
      votes.splice(existingIdx, 1)
    }
    votes.push({ comment_id: commentId, user_id: userId, vote_type: type })
    if (type === "up") comment.likes_count += 1
    else comment.dislikes_count += 1
  }

  write(KEYS.commentVotes, votes)
  write(KEYS.comments, comments)
  return newVote
}

// ─── 채팅 ────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  user_id: string
  nickname: string
  avatar_url: string | null
  content: string
  created_at: string
}

export function getChatMessages(): ChatMessage[] {
  return read<ChatMessage>(KEYS.chatMessages)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-100) // 최근 100개만
}

export function addChatMessage(userId: string, nickname: string, avatarUrl: string | null, content: string): ChatMessage {
  const msg: ChatMessage = {
    id: uid(),
    user_id: userId,
    nickname,
    avatar_url: avatarUrl,
    content,
    created_at: new Date().toISOString(),
  }
  const msgs = read<ChatMessage>(KEYS.chatMessages)
  msgs.push(msg)
  // 최대 500개 유지
  if (msgs.length > 500) msgs.splice(0, msgs.length - 500)
  write(KEYS.chatMessages, msgs)
  return msg
}
