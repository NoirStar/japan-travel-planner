import type { Place } from "@/types/place"
import type { PlaceCategory } from "@/types/place"

interface PlacesSearchResult {
  id: string
  name: string
  nameEn: string
  category: string
  location: { lat: number; lng: number }
  rating?: number
  ratingCount?: number
  address?: string
  description?: string
  image?: string
  googlePlaceId: string
}

interface PlacesSearchResponse {
  places: PlacesSearchResult[]
}

function toPlace(p: PlacesSearchResult, cityId: string): Place {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    category: p.category as PlaceCategory,
    cityId,
    location: p.location,
    rating: p.rating,
    image: p.image,
    description: p.description ?? p.address,
    address: p.address,
    googlePlaceId: p.googlePlaceId,
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
    return data.places.map((p) => toPlace(p, cityId ?? "tokyo"))
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
): Promise<Place[]> {
  try {
    const res = await fetch("/api/places-nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, category }),
    })

    if (!res.ok) {
      console.error("Nearby search failed:", res.status)
      return []
    }

    const data: PlacesSearchResponse = await res.json()
    return data.places.map((p) => toPlace(p, cityId))
  } catch (error) {
    console.error("Nearby search error:", error)
    return []
  }
}
