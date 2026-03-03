import type { VercelRequest, VercelResponse } from "@vercel/node"

// 카테고리 매핑 (3개 API 파일 공통)
function mapGoogleType(types: string[]): string {
  const typeSet = new Set(types)
  if (typeSet.has("restaurant") || typeSet.has("food") || typeSet.has("meal_delivery") || typeSet.has("meal_takeaway") || typeSet.has("japanese_restaurant") || typeSet.has("ramen_restaurant") || typeSet.has("sushi_restaurant")) return "restaurant"
  if (typeSet.has("cafe") || typeSet.has("bakery") || typeSet.has("coffee_shop")) return "cafe"
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

    const placesRes = await fetch(`https://places.googleapis.com/v1/places/${realPlaceId}?languageCode=ko`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,location,rating,types,formattedAddress,photos,userRatingCount,editorialSummary,reviews,regularOpeningHours,websiteUri",
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
      formattedAddress?: string
      photos?: { name: string }[]
      editorialSummary?: { text: string }
      reviews?: { authorAttribution?: { displayName: string }; rating: number; text?: { text: string }; relativePublishTimeDescription: string; publishTime?: string }[]
      regularOpeningHours?: { weekdayDescriptions: string[] }
      websiteUri?: string
    }

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
      address: p.formattedAddress,
      description: p.editorialSummary?.text ?? p.formattedAddress,
      image,
      googlePlaceId: p.id,
      reviews: (p.reviews ?? [])
        .sort((a, b) => {
          if (a.publishTime && b.publishTime) return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
          return 0
        })
        .slice(0, 10)
        .map((r) => ({
        authorName: r.authorAttribution?.displayName ?? "익명",
        rating: r.rating,
        text: r.text?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
        publishTime: r.publishTime,
      })),
      googleMapsUri: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      openingHours: p.regularOpeningHours?.weekdayDescriptions,
      websiteUri: p.websiteUri,
    }

    return res.status(200).json({ place })
  } catch (error) {
    console.error("Place details error:", error)
    return res.status(500).json({ error: "서버 오류가 발생했습니다" })
  }
}
