import { describe, it, expect } from "vitest"
import { normalizeCommunityPost } from "@/lib/communityTransforms"
import type { CommunityPost } from "@/types/community"

describe("communityTransforms — new fields", () => {
  const basePost = {
    id: "post-1",
    user_id: "user-1",
    title: "테스트 게시글",
    city_id: "tokyo",
    board_type: "travel",
    likes_count: 0,
    dislikes_count: 0,
    comments_count: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  } as unknown as CommunityPost

  it("travel_post_stage가 없으면 기본값 plan이 설정된다", () => {
    const normalized = normalizeCommunityPost(basePost)
    expect(normalized.travel_post_stage).toBe("plan")
  })

  it("travel_post_stage가 review이면 그대로 보존된다", () => {
    const post = { ...basePost, travel_post_stage: "review" as const }
    const normalized = normalizeCommunityPost(post)
    expect(normalized.travel_post_stage).toBe("review")
  })

  it("trip_meta가 없으면 null이 된다", () => {
    const normalized = normalizeCommunityPost(basePost)
    expect(normalized.trip_meta).toBeNull()
  })

  it("trip_meta가 있으면 그대로 보존된다", () => {
    const post = { ...basePost, trip_meta: { companionType: "solo" as const } }
    const normalized = normalizeCommunityPost(post)
    expect(normalized.trip_meta?.companionType).toBe("solo")
  })

  it("review_data가 없으면 null이 된다", () => {
    const normalized = normalizeCommunityPost(basePost)
    expect(normalized.review_data).toBeNull()
  })
})
