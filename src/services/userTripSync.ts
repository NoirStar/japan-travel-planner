import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import type { Trip } from "@/types/schedule"

// ─── 서버에서 개인 여행 로드 ────────────────────────────
export async function loadUserTrips(
  userId: string,
): Promise<{ trips: Trip[]; activeTripId: string | null; updatedAt: string } | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from("user_trips")
    .select("trips_data, active_trip_id, updated_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null

  return {
    trips: (data.trips_data ?? []) as Trip[],
    activeTripId: data.active_trip_id,
    updatedAt: data.updated_at,
  }
}

// ─── 서버에 개인 여행 저장 (upsert) ─────────────────────
export async function saveUserTrips(
  userId: string,
  trips: Trip[],
  activeTripId: string | null,
): Promise<string | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase.rpc("upsert_user_trips", {
    p_user_id: userId,
    p_trips_data: trips,
    p_active_trip_id: activeTripId,
  })

  if (error) {
    console.error("[userTripSync] save failed:", error.message)
    return null
  }

  return data as string // updated_at timestamp
}
