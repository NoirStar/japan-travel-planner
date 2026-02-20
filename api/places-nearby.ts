import type { VercelRequest, VercelResponse } from "@vercel/node"

// Places API New (v1) — Nearby Search
const NEARBY_API_URL = "https://places.googleapis.com/v1/places:searchNearby"

// 카테고리 매핑
function mapGoogleType(types: string[]): string {
  const typeSet = new Set(types)
  if (typeSet.has("restaurant") || typeSet.has("food") || typeSet.has("meal_delivery") || typeSet.has("meal_takeaway") || typeSet.has("japanese_restaurant") || typeSet.has("ramen_restaurant") || typeSet.has("sushi_restaurant")) return "restaurant"
  if (typeSet.has("cafe") || typeSet.has("bakery") || typeSet.has("coffee_shop")) return "cafe"
  if (typeSet.has("lodging") || typeSet.has("hotel")) return "accommodation"
  if (typeSet.has("shopping_mall") || typeSet.has("store") || typeSet.has("clothing_store") || typeSet.has("department_store") || typeSet.has("market")) return "shopping"
  if (typeSet.has("transit_station") || typeSet.has("train_station") || typeSet.has("bus_station") || typeSet.has("subway_station")) return "transport"
  return "attraction"
}

// 도시별 중심 좌표
const CITY_CENTER: Record<string, { lat: number; lng: number }> = {
  tokyo: { lat: 35.6762, lng: 139.6503 },
  osaka: { lat: 34.6937, lng: 135.5023 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  fukuoka: { lat: 33.5904, lng: 130.4017 },
}

// 카테고리별 검색 타입
const CATEGORY_TYPES: Record<string, string[]> = {
  attraction: ["tourist_attraction", "museum", "park", "cultural_landmark", "historical_landmark"],
  restaurant: ["restaurant", "japanese_restaurant", "ramen_restaurant", "sushi_restaurant"],
  cafe: ["cafe", "coffee_shop", "bakery"],
  shopping: ["shopping_mall", "market", "department_store"],
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
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
    const { cityId, category } = req.body as {
      cityId: string
      category?: string
    }

    const center = CITY_CENTER[cityId]
    if (!center) {
      return res.status(400).json({ error: "Invalid cityId" })
    }

    const includedTypes = category && CATEGORY_TYPES[category]
      ? CATEGORY_TYPES[category]
      : [...CATEGORY_TYPES.attraction, ...CATEGORY_TYPES.restaurant, ...CATEGORY_TYPES.cafe]

    const requestBody = {
      includedTypes,
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: 15000, // 15km
        },
      },
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      languageCode: "ja",
    }

    const placesRes = await fetch(NEARBY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.rating,places.types,places.formattedAddress,places.photos,places.userRatingCount,places.editorialSummary",
      },
      body: JSON.stringify(requestBody),
    })

    if (!placesRes.ok) {
      const errorText = await placesRes.text()
      console.error("Nearby API error:", errorText)
      return res.status(502).json({ error: "Google Places API 오류" })
    }

    const data = await placesRes.json()
    const places = (data.places ?? []).map((p: {
      id: string
      displayName: { text: string; languageCode: string }
      location: { latitude: number; longitude: number }
      rating?: number
      userRatingCount?: number
      types?: string[]
      formattedAddress?: string
      photos?: { name: string }[]
      editorialSummary?: { text: string }
    }) => {
      let image: string | undefined
      if (p.photos?.[0]) {
        image = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=400&maxHeightPx=300&key=${apiKey}`
      }

      return {
        id: `google-${p.id}`,
        name: p.displayName?.text ?? "",
        nameEn: p.displayName?.text ?? "",
        category: mapGoogleType(p.types ?? []),
        location: {
          lat: p.location?.latitude ?? 0,
          lng: p.location?.longitude ?? 0,
        },
        rating: p.rating,
        ratingCount: p.userRatingCount,
        address: p.formattedAddress,
        description: p.editorialSummary?.text ?? p.formattedAddress,
        image,
        googlePlaceId: p.id,
      }
    })

    return res.status(200).json({ places })
  } catch (error) {
    console.error("Nearby search error:", error)
    return res.status(500).json({ error: "서버 오류가 발생했습니다" })
  }
}
