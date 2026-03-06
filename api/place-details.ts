import type { VercelRequest, VercelResponse } from "@vercel/node"

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
    const { placeId } = req.body as { placeId: string }
    if (!placeId) {
      return res.status(400).json({ error: "placeId is required" })
    }

    const realPlaceId = placeId.replace(/^google-/, "")

    // ★ Pro 등급 (월 5,000건 무료) — 마커 클릭 시만 호출
    // ⚠️ reviews 필드 절대 포함 금지 (Enterprise 등급 → 월 1,000건으로 급감)
    const placesRes = await fetch(`https://places.googleapis.com/v1/places/${realPlaceId}?languageCode=ko`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,location,rating,userRatingCount,types,shortFormattedAddress,photos,regularOpeningHours,googleMapsUri",
      },
    })

    if (!placesRes.ok) {
      const errorText = await placesRes.text()
      console.error("Place Details API error:", errorText)
      return res.status(502).json({ error: "Google Places API 오류" })
    }

    const p = await placesRes.json() as {
      id: string
      displayName: { text: string }
      location: { latitude: number; longitude: number }
      rating?: number
      userRatingCount?: number
      types?: string[]
      shortFormattedAddress?: string
      photos?: { name: string }[]
      regularOpeningHours?: { weekdayDescriptions: string[] }
      googleMapsUri?: string
    }

    // Place Photos API — photo name으로 이미지 URL 생성 (월 10,000건 무료)
    let image: string | undefined
    if (p.photos?.[0]) {
      image = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=400&maxHeightPx=300&key=${apiKey}`
    }

    const place = {
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
      address: p.shortFormattedAddress,
      image,
      googlePlaceId: p.id,
      // reviews 필드 제거 — Enterprise 등급 회피
      // 대신 googleMapsUri로 "구글맵에서 리뷰 보기" 링크 제공
      googleMapsUri: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text ?? "")}&query_place_id=${p.id}`,
      openingHours: p.regularOpeningHours?.weekdayDescriptions,
    }

    return res.status(200).json({ place })
  } catch (error) {
    console.error("Place details error:", error)
    return res.status(500).json({ error: "서버 오류가 발생했습니다" })
  }
}
