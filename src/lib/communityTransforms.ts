import type { Comment, CommunityPost, UserProfile } from "@/types/community"

export function unwrapProfile(profile?: UserProfile | UserProfile[]): UserProfile | undefined {
  if (!profile) return undefined
  return Array.isArray(profile) ? profile[0] : profile
}

export function normalizeCommunityPost(post: CommunityPost): CommunityPost {
  return {
    ...post,
    profiles: unwrapProfile(post.profiles),
    likes_count: Number(post.likes_count) || 0,
    dislikes_count: Number(post.dislikes_count) || 0,
    comments_count: Number(post.comments_count) || 0,
  }
}

export function normalizeComment(comment: Comment): Comment {
  return {
    ...comment,
    profiles: unwrapProfile(comment.profiles),
    likes_count: Number(comment.likes_count) || 0,
    dislikes_count: Number(comment.dislikes_count) || 0,
  }
}
