import type { Trip } from "@/types/schedule"
import { getAnyPlaceById, useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { PlaceCategory } from "@/types/place"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// ── 장소 스냅샷 생성 (공통) ─────────────────────────────
type PlaceSnapshot = { n: string; ne: string; ca: string; ci: string; la: number; ln: number; r?: number; rc?: number; im?: string; ad?: string; gpi?: string; gmu?: string }

function collectPlaceSnapshots(trip: Trip): Record<string, PlaceSnapshot> {
  const placeIds = new Set<string>()
  for (const day of trip.days) {
    for (const item of day.items) {
      placeIds.add(item.placeId)
    }
  }

  const snapshots: Record<string, PlaceSnapshot> = {}
  for (const id of placeIds) {
    const place = getAnyPlaceById(id)
    if (place) {
      snapshots[id] = {
        n: place.name, ne: place.nameEn, ca: place.category, ci: place.cityId,
        la: place.location.lat, ln: place.location.lng,
        r: place.rating, rc: place.ratingCount,
        im: place.image, ad: place.address,
        gpi: place.googlePlaceId, gmu: place.googleMapsUri,
      }
    }
  }
  return snapshots
}

function buildCompactTrip(trip: Trip) {
  return {
    t: trip.title, c: trip.cityId, sd: trip.startDate, ed: trip.endDate,
    d: trip.days.map((day) => ({
      n: day.dayNumber, dt: day.date,
      i: day.items.map((item) => ({ p: item.placeId, s: item.startTime, m: item.memo })),
    })),
  }
}

function restorePlaceSnapshots(snapshots: Record<string, PlaceSnapshot>) {
  const { addPlace } = useDynamicPlaceStore.getState()
  const validCategories = Object.values(PlaceCategory) as string[]
  for (const [id, s] of Object.entries(snapshots)) {
    if (getAnyPlaceById(id)) continue
    addPlace({
      id, name: s.n, nameEn: s.ne,
      category: validCategories.includes(s.ca) ? s.ca as PlaceCategory : PlaceCategory.OTHER,
      cityId: s.ci, location: { lat: s.la, lng: s.ln },
      rating: s.r, ratingCount: s.rc, image: s.im, address: s.ad,
      googlePlaceId: s.gpi, googleMapsUri: s.gmu,
    })
  }
}

function compactToTrip(compact: { t: string; c: string; sd?: string; ed?: string; d: { n: number; dt?: string; i: { p: string; s?: string; m?: string }[] }[] }): Trip {
  const now = new Date().toISOString()
  let itemCounter = 0
  return {
    id: `shared-${Date.now()}`,
    title: compact.t, cityId: compact.c, startDate: compact.sd, endDate: compact.ed,
    days: compact.d.map((day, di) => ({
      id: `shared-day-${di}`, dayNumber: day.n, date: day.dt,
      items: day.i.map((item) => ({
        id: `shared-item-${++itemCounter}`, placeId: item.p, startTime: item.s, memo: item.m,
      })),
    })),
    createdAt: now, updatedAt: now,
  }
}

// ── Base64 인코딩/디코딩 (레거시 + 오프라인 폴백) ──────
export function encodeTrip(trip: Trip): string {
  const compact = { ...buildCompactTrip(trip), pl: collectPlaceSnapshots(trip) }
  const json = JSON.stringify(compact)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodeTrip(encoded: string): Trip | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4) base64 += "="
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const compact = JSON.parse(new TextDecoder().decode(bytes))
    if (compact.pl) restorePlaceSnapshots(compact.pl)
    return compactToTrip(compact)
  } catch {
    return null
  }
}

// ── DB 기반 공유 (Supabase RPC) ─────────────────────────
export async function createShareLink(trip: Trip): Promise<{ code: string } | null> {
  if (!isSupabaseConfigured) return null
  try {
    const tripData = buildCompactTrip(trip)
    const placeData = collectPlaceSnapshots(trip)
    const { data, error } = await supabase.rpc("create_trip_share", {
      p_trip_data: tripData,
      p_place_data: placeData,
    })
    if (error || !data) return null
    return { code: data as string }
  } catch {
    return null
  }
}

export async function loadShareByCode(code: string): Promise<Trip | null> {
  try {
    const { data, error } = await supabase.rpc("get_trip_share", { p_share_code: code })
    if (error || !data) return null
    const result = data as { trip_data: ReturnType<typeof buildCompactTrip>; place_data: Record<string, PlaceSnapshot> }
    if (result.place_data) restorePlaceSnapshots(result.place_data)
    return compactToTrip(result.trip_data)
  } catch {
    return null
  }
}

// ── 공유 URL 생성 (DB 우선, 미지원시 base64 폴백) ──────
export async function generateShareUrl(trip: Trip): Promise<string> {
  const baseUrl = window.location.origin

  // 로그인 + Supabase 설정 시 DB 기반 짧은 공유 URL
  const dbResult = await createShareLink(trip)
  if (dbResult) {
    return `${baseUrl}/s/${dbResult.code}`
  }

  // 폴백: base64 인라인 공유
  return `${baseUrl}/share/${encodeTrip(trip)}`
}

/**
 * 클립보드에 공유 URL 복사
 */
export async function copyShareUrl(trip: Trip): Promise<boolean> {
  try {
    const url = await generateShareUrl(trip)
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
