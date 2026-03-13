import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { getAnyPlaceById, useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import type { Trip } from "@/types/schedule"
import type { Place } from "@/types/place"
import { PlaceCategory } from "@/types/place"

// ─── 타입 ───────────────────────────────────────────────
export type MemberRole = "owner" | "editor" | "viewer"

export interface TripMember {
  user_id: string
  role: MemberRole
  nickname: string
  avatar_url: string | null
  joined_at: string
}

interface SharedTripRow {
  id: string
  owner_id: string
  invite_code: string
  trip_data: Record<string, unknown>
  place_data: Record<string, PlaceSnapshot>
  version: number
  updated_at: string
}

interface PlaceSnapshot {
  n: string    // name
  ne: string   // nameEn
  ca: string   // category
  ci: string   // cityId
  la: number   // lat
  ln: number   // lng
  r?: number   // rating
  im?: string  // image
  ad?: string  // address
  gpi?: string // googlePlaceId
  gmu?: string // googleMapsUri
}

// ─── 장소 스냅샷 ↔ Place 변환 ───────────────────────────
function collectPlaceSnapshots(trip: Trip): Record<string, PlaceSnapshot> {
  const snaps: Record<string, PlaceSnapshot> = {}
  for (const day of trip.days) {
    for (const item of day.items) {
      if (snaps[item.placeId]) continue
      const place = getAnyPlaceById(item.placeId)
      if (!place) continue
      snaps[item.placeId] = {
        n: place.name,
        ne: place.nameEn,
        ca: place.category,
        ci: place.cityId,
        la: place.location.lat,
        ln: place.location.lng,
        r: place.rating,
        im: place.image,
        ad: place.address,
        gpi: place.googlePlaceId,
        gmu: place.googleMapsUri,
      }
    }
  }
  return snaps
}

function restorePlaceSnapshots(snapshots: Record<string, PlaceSnapshot>) {
  const { addPlace } = useDynamicPlaceStore.getState()
  const validCategories = Object.values(PlaceCategory) as string[]

  for (const [id, s] of Object.entries(snapshots)) {
    if (getAnyPlaceById(id)) continue // 이미 로컬에 존재
    const category = validCategories.includes(s.ca) ? s.ca as Place["category"] : PlaceCategory.OTHER
    addPlace({
      id,
      name: s.n,
      nameEn: s.ne,
      category,
      cityId: s.ci,
      location: { lat: s.la, lng: s.ln },
      rating: s.r,
      image: s.im,
      address: s.ad,
      googlePlaceId: s.gpi,
      googleMapsUri: s.gmu,
    })
  }
}

// ─── trip_data 직렬화 (sharedId 제외) ───────────────────
function tripToData(trip: Trip): Record<string, unknown> {
  const { sharedId: _, ...rest } = trip
  return rest as Record<string, unknown>
}

// ─── API ────────────────────────────────────────────────

/** 여행을 공유 모드로 전환 → invite_code 반환 */
export async function shareTrip(
  trip: Trip,
  userId: string,
): Promise<{ sharedId: string; inviteCode: string }> {
  const placeData = collectPlaceSnapshots(trip)

  const { data, error } = await supabase
    .from("shared_trips")
    .insert({
      owner_id: userId,
      trip_data: tripToData(trip),
      place_data: placeData,
    })
    .select("id, invite_code")
    .single()

  if (error || !data) throw new Error(error?.message ?? "Failed to share trip")

  // owner 자신을 멤버로 추가
  await supabase.from("trip_members").insert({
    trip_id: data.id,
    user_id: userId,
    role: "owner",
  })

  return { sharedId: data.id, inviteCode: data.invite_code }
}

/** 초대 코드로 여행 참여 */
export async function joinTripByInvite(inviteCode: string): Promise<{
  tripId: string
  tripData: Record<string, unknown>
  role: MemberRole
  alreadyMember: boolean
}> {
  const { data, error } = await supabase.rpc("join_trip_by_invite", {
    p_invite_code: inviteCode,
  })

  if (error || !data) throw new Error(error?.message ?? "Failed to join trip")

  const result = data as {
    trip_id: string
    trip_data: Record<string, unknown>
    place_data: Record<string, PlaceSnapshot>
    role: MemberRole
    already_member: boolean
  }

  // 장소 데이터 복원
  if (result.place_data) {
    restorePlaceSnapshots(result.place_data)
  }

  return {
    tripId: result.trip_id,
    tripData: result.trip_data,
    role: result.role,
    alreadyMember: result.already_member,
  }
}

/** 공유 여행 데이터 저장 (에디터/오너만 가능) */
export async function saveTripToServer(
  sharedId: string,
  trip: Trip,
): Promise<number> {
  const placeData = collectPlaceSnapshots(trip)

  // version을 원자적으로 증가 (race condition 방지)
  const { data, error } = await supabase.rpc("increment_shared_trip_version", {
    p_trip_id: sharedId,
    p_trip_data: tripToData(trip),
    p_place_data: placeData,
  })

  if (error) throw new Error(error.message)

  return (data as number) ?? 1
}

/** 서버에서 최신 여행 데이터 가져오기 */
export async function loadTripFromServer(
  sharedId: string,
): Promise<{ tripData: Record<string, unknown>; version: number } | null> {
  const { data, error } = await supabase
    .from("shared_trips")
    .select("trip_data, place_data, version")
    .eq("id", sharedId)
    .single()

  if (error || !data) return null

  const row = data as Pick<SharedTripRow, "trip_data" | "place_data" | "version">

  // 장소 복원
  if (row.place_data) {
    restorePlaceSnapshots(row.place_data)
  }

  return { tripData: row.trip_data, version: row.version }
}

/** 멤버 목록 조회 */
export async function getMembers(sharedId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from("trip_members")
    .select(`
      user_id,
      role,
      joined_at,
      profiles:user_id (nickname, avatar_url)
    `)
    .eq("trip_id", sharedId)
    .order("joined_at")

  if (error || !data) return []

  return (data as Array<{
    user_id: string
    role: MemberRole
    joined_at: string
    profiles: { nickname: string; avatar_url: string | null }
  }>).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    nickname: m.profiles?.nickname ?? "Unknown",
    avatar_url: m.profiles?.avatar_url ?? null,
    joined_at: m.joined_at,
  }))
}

/** 멤버 삭제 (owner만) */
export async function removeMember(sharedId: string, userId: string): Promise<void> {
  await supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", sharedId)
    .eq("user_id", userId)
}

/** 본인 탈퇴 */
export async function leaveTrip(sharedId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  await supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", sharedId)
    .eq("user_id", session.user.id)
}

/** 공유 여행 삭제 (owner만) */
export async function deleteSharedTrip(sharedId: string): Promise<void> {
  await supabase
    .from("shared_trips")
    .delete()
    .eq("id", sharedId)
}

/** 초대 코드 조회 */
export async function getInviteCode(sharedId: string): Promise<string | null> {
  const { data } = await supabase
    .from("shared_trips")
    .select("invite_code")
    .eq("id", sharedId)
    .single()

  return data?.invite_code ?? null
}

/** 기능 사용 가능 여부 */
export function isCollabAvailable(): boolean {
  return isSupabaseConfigured && !localStorage.getItem("demo_logged_in")
}
