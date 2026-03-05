import type { Place } from "@/types/place"
import type { PlaceCategory } from "@/types/place"

// ─── Place Details 캐시 (localStorage) ─────────────────
const CACHE_KEY_PREFIX = "place-detail:"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24시간

interface CachedDetail {
  place: Place
  ts: number
}

function getCachedDetail(placeId: string): Place | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + placeId)
    if (!raw) return null
    const cached: CachedDetail = JSON.parse(raw)
    if (Date.now() - cached.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY_PREFIX + placeId)
      return null
    }
    return cached.place
  } catch {
    return null
  }
}

function setCachedDetail(placeId: string, place: Place) {
  try {
    const entry: CachedDetail = { place, ts: Date.now() }
    localStorage.setItem(CACHE_KEY_PREFIX + placeId, JSON.stringify(entry))
  } catch {
    // quota 초과 시 무시
  }
}

// Essentials 등급 응답 (마커용 최소 데이터)
interface PlacesSearchResult {
  id: string
  name: string
  nameEn: string
  category: string
  location: { lat: number; lng: number }
  googlePlaceId: string
}

// Pro 등급 응답 (Details)
interface PlaceDetailsResult extends PlacesSearchResult {
  rating?: number
  ratingCount?: number
  address?: string
  description?: string
  image?: string
  googleMapsUri?: string
  openingHours?: string[]
}

interface PlacesSearchResponse {
  places: PlacesSearchResult[]
}

interface PlaceDetailsResponse {
  place: PlaceDetailsResult
}

// Essentials 등급 응답 → Place 변환 (마커용 최소 데이터)
function toMarkerPlace(p: PlacesSearchResult, cityId: string): Place {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category as PlaceCategory,
    cityId,
    location: p.location,
    googlePlaceId: p.googlePlaceId,
  }
}

// Pro 등급 응답 → Place 변환 (상세 데이터)
function toDetailPlace(p: PlaceDetailsResult, cityId: string): Place {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category as PlaceCategory,
    cityId,
    location: p.location,
    rating: p.rating,
    ratingCount: p.ratingCount,
    image: p.image,
    description: p.description ?? p.address,
    address: p.address,
    googlePlaceId: p.googlePlaceId,
    googleMapsUri: p.googleMapsUri,
    openingHours: p.openingHours,
  }
}

/**
 * Google Places API를 통해 장소를 검색합니다.
 * Vercel Serverless Function을 통해 호출됩니다.
 */
export async function searchGooglePlaces(
  query: string,
  cityId?: string,
): Promise<Place[]> {
  try {
    const res = await fetch("/api/places-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, cityId }),
    })

    if (!res.ok) {
      console.error("Places search failed:", res.status)
      return []
    }

    const data: PlacesSearchResponse = await res.json()
    return data.places.map((p) => toMarkerPlace(p, cityId ?? "tokyo"))
  } catch (error) {
    console.error("Places search error:", error)
    return []
  }
}

/**
 * 도시 주변 인기 장소를 가져옵니다 (Nearby Search).
 */
export async function fetchNearbyPlaces(
  cityId: string,
  category?: string,
  minRating?: number,
): Promise<Place[]> {
  try {
    const res = await fetch("/api/places-nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, category, minRating }),
    })

    if (!res.ok) {
      console.error("Nearby search failed:", res.status)
      return []
    }

    const data: PlacesSearchResponse = await res.json()
    return data.places.map((p) => toMarkerPlace(p, cityId))
  } catch (error) {
    console.error("Nearby search error:", error)
    return []
  }
}

/**
 * Google Place ID로 장소 상세 정보를 가져옵니다.
 * ★ Pro 등급 (월 5,000건 무료) — 마커 클릭 시만 호출
 * ★ localStorage 캐시: 같은 장소를 다시 클릭해도 API를 재호출하지 않음 (24h TTL)
 */
export async function fetchPlaceDetails(
  placeId: string,
  cityId: string = "tokyo",
): Promise<Place | null> {
  // 캐시 히트 → API 호출 없이 반환
  const cached = getCachedDetail(placeId)
  if (cached) return cached

  try {
    const res = await fetch("/api/place-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    })

    if (!res.ok) {
      console.error("Place details failed:", res.status)
      return null
    }

    const data: PlaceDetailsResponse = await res.json()
    if (!data.place) return null

    const place = toDetailPlace(data.place, cityId)
    setCachedDetail(placeId, place)
    return place
  } catch (error) {
    console.error("Place details error:", error)
    return null
  }
}
