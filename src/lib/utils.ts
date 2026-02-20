import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── 거리/이동시간 계산 ─────────────────────────────────

/** Haversine 공식으로 두 좌표 간 직선 거리(km) 계산 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** 교통수단 종류 */
export type TransportMode = "walk" | "metro" | "train" | "bus"

export interface TravelEstimate {
  minutes: number
  mode: TransportMode
  distanceKm: number
}

/**
 * 두 좌표 사이 예상 대중교통 이동시간을 계산한다.
 * 거리별로 최적 교통수단을 자동 판단하여 일본 도시 내 이동에 맞는
 * 현실적인 시간을 추정한다.
 *
 * - ~0.8km: 도보 (평균 5km/h)
 * - ~5km: 지하철 (평균 30km/h, 승하차/대기 7분)
 * - ~20km: 전철/JR (평균 40km/h, 환승/대기 10분)
 * - 20km+: 신칸센/특급 (평균 80km/h, 대기 15분)
 */
export function estimateTravelTime(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  return estimateTravel(lat1, lng1, lat2, lng2).minutes
}

/**
 * 상세 이동 정보를 반환한다 (교통수단, 시간, 거리).
 */
export function estimateTravel(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): TravelEstimate {
  const straightDist = haversineDistance(lat1, lng1, lat2, lng2)

  // 도보 (0.8km 이내)
  if (straightDist <= 0.8) {
    const walkDist = straightDist * 1.3 // 도로 우회
    const minutes = Math.max(1, Math.round((walkDist / 5) * 60))
    return { minutes, mode: "walk", distanceKm: walkDist }
  }

  // 지하철 (5km 이내)
  if (straightDist <= 5) {
    const transitDist = straightDist * 1.4
    const travelTime = (transitDist / 30) * 60
    const minutes = Math.round(travelTime + 7) // 대기+승하차 7분
    return { minutes, mode: "metro", distanceKm: transitDist }
  }

  // 전철/JR (20km 이내)
  if (straightDist <= 20) {
    const transitDist = straightDist * 1.3
    const travelTime = (transitDist / 40) * 60
    const minutes = Math.round(travelTime + 10) // 환승+대기 10분
    return { minutes, mode: "train", distanceKm: transitDist }
  }

  // 장거리 (특급/신칸센)
  const transitDist = straightDist * 1.2
  const travelTime = (transitDist / 80) * 60
  const minutes = Math.round(travelTime + 15) // 대기 15분
  return { minutes, mode: "train", distanceKm: transitDist }
}

/**
 * 이동시간(분)을 사람이 읽기 쉬운 문자열로 포맷한다.
 */
export function formatTravelTime(minutes: number, mode?: TransportMode): string {
  const modeLabel = mode === "walk" ? "도보" : mode === "metro" ? "지하철" : mode === "train" ? "전철" : mode === "bus" ? "버스" : ""
  const prefix = modeLabel ? `${modeLabel} ` : ""

  if (minutes < 1) return `${prefix}1분`
  if (minutes < 60) return `${prefix}약 ${minutes}분`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${prefix}약 ${hours}시간`
  return `${prefix}약 ${hours}시간 ${mins}분`
}

/**
 * 거리(km)를 사람이 읽기 쉬운 문자열로 포맷한다.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
