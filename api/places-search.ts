import type { VercelRequest, VercelResponse } from "@vercel/node"

// ─── 타입 ─────────────────────────────────────────────────
interface PlaceResult {
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

// Places API New (v1) — Text Search
const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"

// 카테고리 매핑 (3개 API 파일 공통)
// 주의: cafe/bakery를 restaurant보다 먼저 체크해야 일본 카페가 식당으로 분류되지 않음
function mapGoogleType(types: string[]): string {
  const typeSet = new Set(types)
  if (typeSet.has("cafe") || typeSet.has("bakery") || typeSet.has("coffee_shop")) return "cafe"
  if (typeSet.has("restaurant") || typeSet.has("food") || typeSet.has("meal_delivery") || typeSet.has("meal_takeaway") || typeSet.has("japanese_restaurant") || typeSet.has("ramen_restaurant") || typeSet.has("sushi_restaurant")) return "restaurant"
  if (typeSet.has("lodging") || typeSet.has("hotel")) return "accommodation"
  if (typeSet.has("shopping_mall") || typeSet.has("store") || typeSet.has("clothing_store") || typeSet.has("department_store") || typeSet.has("market")) return "shopping"
  if (typeSet.has("transit_station") || typeSet.has("train_station") || typeSet.has("bus_station") || typeSet.has("subway_station")) return "transport"
  if (typeSet.has("tourist_attraction") || typeSet.has("museum") || typeSet.has("park") || typeSet.has("place_of_worship") || typeSet.has("shrine") || typeSet.has("temple") || typeSet.has("cultural_landmark") || typeSet.has("historical_landmark")) return "attraction"
  return "attraction"
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "Google API key not configured" })
  }

  try {
    const { query, cityId, location } = req.body as {
      query: string
      cityId?: string
      location?: { lat: number; lng: number }
    }

    if (!query) {
      return res.status(400).json({ error: "query is required" })
    }

    // 도시별 검색 범위 설정
    const cityBias: Record<string, { lat: number; lng: number }> = {
      tokyo: { lat: 35.6762, lng: 139.6503 },
      osaka: { lat: 34.6937, lng: 135.5023 },
      kyoto: { lat: 35.0116, lng: 135.7681 },
      fukuoka: { lat: 33.5904, lng: 130.4017 },
    }

    const center = location || (cityId && cityBias[cityId]) || cityBias.tokyo

    const requestBody = {
      textQuery: `${query} Japan`,
      locationBias: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: 30000, // 30km
        },
      },
      maxResultCount: 10,
      languageCode: "ko",
    }

    // ★ Essentials 등급 (월 10,000건 무료) — 마커 표시용 최소 필드만 요청
    const placesRes = await fetch(PLACES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.types",
      },
      body: JSON.stringify(requestBody),
    })

    if (!placesRes.ok) {
      const errorText = await placesRes.text()
      console.error("Places API error:", errorText)
      return res.status(502).json({ error: "Google Places API 오류" })
    }

    const data = await placesRes.json()
    // Essentials 등급 — 마커 좌표 + 이름 + 카테고리만 반환
    const places: PlaceResult[] = (data.places ?? []).map((p: {
      id: string
      displayName: { text: string; languageCode: string }
      location: { latitude: number; longitude: number }
      types?: string[]
    }) => ({
      id: `google-${p.id}`,
      name: p.displayName?.text ?? "",
      nameEn: p.displayName?.text ?? "",
      category: mapGoogleType(p.types ?? []),
      location: {
        lat: p.location?.latitude ?? 0,
        lng: p.location?.longitude ?? 0,
      },
      googlePlaceId: p.id,
    }))

    return res.status(200).json({ places })
  } catch (error) {
    console.error("Places search error:", error)
    return res.status(500).json({ error: "서버 오류가 발생했습니다" })
  }
}
