import type { Place } from "@/types/place"
import type { PlaceCategory } from "@/types/place"

// ─── Place Details 캐시 (localStorage) ─────────────────
const CACHE_KEY_PREFIX = "place-detail:"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24시간

// ─── 검색 결과 캐시 (오프라인 대응) ───────────────────────
const SEARCH_CACHE_PREFIX = "search-cache:"
const SEARCH_CACHE_TTL = 30 * 60 * 1000 // 30분

interface CachedSearch {
  results: Place[]
  ts: number
}

function getSearchCache(key: string): Place[] | null {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_PREFIX + key)
    if (!raw) return null
    const cached: CachedSearch = JSON.parse(raw)
    if (Date.now() - cached.ts > SEARCH_CACHE_TTL) {
      localStorage.removeItem(SEARCH_CACHE_PREFIX + key)
      return null
    }
    return cached.results
  } catch {
    return null
  }
}

function setSearchCache(key: string, results: Place[]) {
  try {
    localStorage.setItem(SEARCH_CACHE_PREFIX + key, JSON.stringify({ results, ts: Date.now() }))
  } catch { /* quota */ }
}

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

// 검색 응답 (마커 + 별점)
interface PlacesSearchResult {
  id: string
  name: string
  nameEn: string
  category: string
  location: { lat: number; lng: number }
  googlePlaceId: string
  rating?: number
  ratingCount?: number
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

// 검색 응답 → Place 변환 (마커 + 별점)
function toMarkerPlace(p: PlacesSearchResult, cityId: string): Place {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category as PlaceCategory,
    cityId,
    location: p.location,
    googlePlaceId: p.googlePlaceId,
    rating: p.rating,
    ratingCount: p.ratingCount,
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
    description: p.description,
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
  const cacheKey = `text:${query}:${cityId ?? ""}`
  const cached = getSearchCache(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch("/api/places-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, cityId }),
    })

    if (!res.ok) {
      console.error("Places search failed:", res.status)
      return getSearchCache(cacheKey) ?? []
    }

    const data: PlacesSearchResponse = await res.json()
    const places = data.places.map((p) => toMarkerPlace(p, cityId ?? "tokyo"))
    setSearchCache(cacheKey, places)
    return places
  } catch (error) {
    console.error("Places search error:", error)
    // 오프라인 시 캐시에서 반환
    return getSearchCache(cacheKey) ?? []
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
  const cacheKey = `nearby:${cityId}:${category ?? ""}:${minRating ?? ""}`
  const cached = getSearchCache(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch("/api/places-nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, category, minRating }),
    })

    if (!res.ok) {
      console.error("Nearby search failed:", res.status)
      return getSearchCache(cacheKey) ?? []
    }

    const data: PlacesSearchResponse = await res.json()
    const places = data.places.map((p) => toMarkerPlace(p, cityId))
    setSearchCache(cacheKey, places)
    return places
  } catch (error) {
    console.error("Nearby search error:", error)
    return getSearchCache(cacheKey) ?? []
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
