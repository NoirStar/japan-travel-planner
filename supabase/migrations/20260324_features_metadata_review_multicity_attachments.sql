-- ═══════════════════════════════════════════════════════
-- Feature 1: Structured trip metadata on posts
-- Feature 3: Post-travel review mode
-- Feature 4: Multi-city day support
-- Feature 5: Reservation attachment metadata
-- ═══════════════════════════════════════════════════════

-- ── Feature 1 + 3: trip_meta, travel_post_stage, review_data on posts ──

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS trip_meta jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS travel_post_stage text NOT NULL DEFAULT 'plan'
    CHECK (travel_post_stage IN ('plan', 'review')),
  ADD COLUMN IF NOT EXISTS review_data jsonb DEFAULT NULL;

CREATE INDEX IF NOT EXISTS posts_travel_post_stage_idx ON posts (travel_post_stage);

COMMENT ON COLUMN posts.trip_meta IS 'Structured metadata: companionType, budgetBand, walkingIntensity, foodFocus, shoppingFocus, visitMonth, staminaLevel';
COMMENT ON COLUMN posts.travel_post_stage IS 'plan = itinerary only, review = post-trip review';
COMMENT ON COLUMN posts.review_data IS 'Post-trip review: actualCost, visitedPlaceIds, skippedPlaceIds, tips, overallRating';
