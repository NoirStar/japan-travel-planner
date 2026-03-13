import type { Trip } from "@/types/schedule"
import { getAnyPlaceById, useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { PlaceCategory } from "@/types/place"
import type { Place } from "@/types/place"

/**
 * Trip 데이터를 URL-safe base64 문자열로 인코딩
 * 장소 스냅샷을 포함하여 다른 기기에서도 일정을 복원 가능하게 함
 */
export function encodeTrip(trip: Trip): string {
  // 일정에 포함된 모든 장소 ID 수집 → 스냅샷 저장
  const placeIds = new Set<string>()
  for (const day of trip.days) {
    for (const item of day.items) {
      placeIds.add(item.placeId)
    }
  }

  // 장소 스냅샷 (중복 제거, 최소 필드만)
  const placeSnapshots: Record<string, { n: string; ne: string; ca: string; ci: string; la: number; ln: number; r?: number; rc?: number; im?: string; ad?: string; gpi?: string; gmu?: string }> = {}
  for (const id of placeIds) {
    const place = getAnyPlaceById(id)
    if (place) {
      placeSnapshots[id] = {
        n: place.name,
        ne: place.nameEn,
        ca: place.category,
        ci: place.cityId,
        la: place.location.lat,
        ln: place.location.lng,
        r: place.rating,
        rc: place.ratingCount,
        im: place.image,
        ad: place.address,
        gpi: place.googlePlaceId,
        gmu: place.googleMapsUri,
      }
    }
  }

  const compact = {
    t: trip.title,
    c: trip.cityId,
    sd: trip.startDate,
    ed: trip.endDate,
    d: trip.days.map((day) => ({
      n: day.dayNumber,
      dt: day.date,
      i: day.items.map((item) => ({
        p: item.placeId,
        s: item.startTime,
        m: item.memo,
      })),
    })),
    pl: placeSnapshots,
  }

  const json = JSON.stringify(compact)
  // Base64 URL-safe encoding (TextEncoder 사용)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  const base64 = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return base64
}

/**
 * URL-safe base64 문자열을 Trip 데이터로 디코딩
 * 포함된 장소 스냅샷을 dynamicPlaceStore에 복원
 */
export function decodeTrip(encoded: string): Trip | null {
  try {
    // Base64 URL-safe decoding (TextDecoder 사용)
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    // Pad if needed
    while (base64.length % 4) base64 += "="
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const compact = JSON.parse(json)

    // 장소 스냅샷 복원 → dynamicPlaceStore에 주입
    if (compact.pl && typeof compact.pl === "object") {
      const { addPlace } = useDynamicPlaceStore.getState()
      for (const [id, snap] of Object.entries(compact.pl)) {
        const s = snap as { n: string; ne: string; ca: string; ci: string; la: number; ln: number; r?: number; rc?: number; im?: string; ad?: string; gpi?: string; gmu?: string }
        const validCategories = Object.values(PlaceCategory) as string[]
        const category = validCategories.includes(s.ca) ? s.ca as PlaceCategory : PlaceCategory.OTHER
        const place: Place = {
          id,
          name: s.n,
          nameEn: s.ne,
          category,
          cityId: s.ci,
          location: { lat: s.la, lng: s.ln },
          rating: s.r,
          ratingCount: s.rc,
          image: s.im,
          address: s.ad,
          googlePlaceId: s.gpi,
          googleMapsUri: s.gmu,
        }
        // 이미 존재하면 덮어쓰지 않음 (로컬 데이터가 더 최신일 수 있음)
        if (!getAnyPlaceById(id)) {
          addPlace(place)
        }
      }
    }

    const now = new Date().toISOString()
    let itemCounter = 0

    const trip: Trip = {
      id: `shared-${Date.now()}`,
      title: compact.t,
      cityId: compact.c,
      startDate: compact.sd,
      endDate: compact.ed,
      days: compact.d.map((day: { n: number; dt?: string; i: { p: string; s?: string; m?: string }[] }, di: number) => ({
        id: `shared-day-${di}`,
        dayNumber: day.n,
        date: day.dt,
        items: day.i.map((item: { p: string; s?: string; m?: string }) => ({
          id: `shared-item-${++itemCounter}`,
          placeId: item.p,
          startTime: item.s,
          memo: item.m,
        })),
      })),
      createdAt: now,
      updatedAt: now,
    }

    return trip
  } catch {
    return null
  }
}

/**
 * 현재 페이지의 공유 URL 생성
 */
export function generateShareUrl(trip: Trip): string {
  const encoded = encodeTrip(trip)
  const baseUrl = window.location.origin
  return `${baseUrl}/share/${encoded}`
}

/**
 * 클립보드에 공유 URL 복사
 */
export async function copyShareUrl(trip: Trip): Promise<boolean> {
  try {
    const url = generateShareUrl(trip)
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
