/**
 * localStorage 기반 커뮤니티 Mock — Supabase 미설정 시 데모 모드 지원
 */
import type { CommunityPost, Comment, VoteType, UserProfile } from "@/types/community"
import { calculateLevel } from "@/types/community"

const KEYS = {
  posts: "mock_community_posts",
  comments: "mock_community_comments",
  votes: "mock_community_votes",
  demoUser: "mock_demo_user",
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

// ─── 데모 유저 ───────────────────────────────────────────
export const DEMO_USER_ID = "demo-user-0001"

export function getDemoProfile(): UserProfile {
  const stored = localStorage.getItem(KEYS.demoUser)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch { /* fallthrough */ }
  }
  const profile: UserProfile = {
    id: DEMO_USER_ID,
    nickname: "タビ旅人",
    avatar_url: null,
    total_likes: 0,
    level: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  localStorage.setItem(KEYS.demoUser, JSON.stringify(profile))
  return profile
}

export function updateDemoProfile(updates: Partial<Pick<UserProfile, "nickname" | "avatar_url">>): UserProfile {
  const profile = getDemoProfile()
  const updated = { ...profile, ...updates, updated_at: new Date().toISOString() }
  localStorage.setItem(KEYS.demoUser, JSON.stringify(updated))
  return updated
}

function refreshDemoLikes(): UserProfile {
  const profile = getDemoProfile()
  // 데모 유저의 게시글에 달린 추천 수 합산
  const posts = read<CommunityPost>(KEYS.posts).filter((p) => p.user_id === DEMO_USER_ID)
  const totalLikes = posts.reduce((sum, p) => sum + p.likes_count, 0)
  const level = calculateLevel(totalLikes)
  const updated = { ...profile, total_likes: totalLikes, level, updated_at: new Date().toISOString() }
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
  const profile = getDemoProfile()
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
    // 같은 투표 → 취소
    votes.splice(existingIdx, 1)
    if (type === "up") post.likes_count = Math.max(0, post.likes_count - 1)
    else post.dislikes_count = Math.max(0, post.dislikes_count - 1)
    newVote = null
  } else {
    if (existing) {
      // 다른 투표로 변경
      if (existing.vote_type === "up") post.likes_count = Math.max(0, post.likes_count - 1)
      else post.dislikes_count = Math.max(0, post.dislikes_count - 1)
      votes.splice(existingIdx, 1)
    }
    votes.push({ post_id: postId, user_id: userId, vote_type: type })
    if (type === "up") post.likes_count += 1
    else post.dislikes_count += 1
  }

  write(KEYS.votes, votes)
  write(KEYS.posts, posts)
  refreshDemoLikes()
  return newVote
}

// ─── 댓글 ────────────────────────────────────────────────
export function fetchMockComments(postId: string): Comment[] {
  return read<Comment>(KEYS.comments)
    .filter((c) => c.post_id === postId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export function addMockComment(postId: string, userId: string, content: string): Comment {
  const profile = getDemoProfile()
  const comment: Comment = {
    id: uid(),
    post_id: postId,
    user_id: userId,
    content,
    created_at: new Date().toISOString(),
    profiles: profile,
  }
  const comments = read<Comment>(KEYS.comments)
  comments.push(comment)
  write(KEYS.comments, comments)

  // 게시글 댓글 수 증가
  const posts = read<CommunityPost>(KEYS.posts)
  const post = posts.find((p) => p.id === postId)
  if (post) {
    post.comments_count += 1
    write(KEYS.posts, posts)
  }
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
