import type { Trip } from "@/types/schedule"

/**
 * Trip 데이터를 URL-safe base64 문자열로 인코딩
 */
export function encodeTrip(trip: Trip): string {
  // 핵심 데이터만 추출 (ID, createdAt 등 제외)
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
  }

  const json = JSON.stringify(compact)
  // Base64 URL-safe encoding
  const base64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return base64
}

/**
 * URL-safe base64 문자열을 Trip 데이터로 디코딩
 */
export function decodeTrip(encoded: string): Trip | null {
  try {
    // Base64 URL-safe decoding
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    // Pad if needed
    while (base64.length % 4) base64 += "="
    const json = decodeURIComponent(escape(atob(base64)))
    const compact = JSON.parse(json)

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
