/**
 * 로컬 개발용 API 서버.
 * Vercel serverless function (api/*.ts) 대신 로컬에서 동일 로직 실행.
 *
 * 사용: node api-dev-server.mjs
 * → http://localhost:3001 에서 /api/places-nearby, /api/places-search 처리
 */
import http from "http"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, ".env.local") })

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
if (!API_KEY) {
  console.error("❌ API key not found. Set VITE_GOOGLE_MAPS_API_KEY in .env.local")
  process.exit(1)
}

// ── 도시 좌표 ───────────────────────────────────────────
const CITY_CENTER = {
  tokyo: { lat: 35.6762, lng: 139.6503 },
  osaka: { lat: 34.6937, lng: 135.5023 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  fukuoka: { lat: 33.5904, lng: 130.4017 },
}

const CATEGORY_TYPES = {
  attraction: ["tourist_attraction", "museum", "park"],
  restaurant: ["restaurant"],
  cafe: ["cafe", "bakery"],
  shopping: ["shopping_mall", "department_store", "clothing_store"],
  accommodation: ["lodging"],
  transport: ["transit_station", "train_station", "bus_station", "subway_station"],
}

// 주의: cafe/bakery를 restaurant보다 먼저 체크해야 일본 카페가 식당으로 분류되지 않음
function mapGoogleType(types) {
  const s = new Set(types)
  if (s.has("cafe") || s.has("bakery") || s.has("coffee_shop")) return "cafe"
  if (s.has("restaurant") || s.has("food") || s.has("japanese_restaurant") || s.has("ramen_restaurant") || s.has("sushi_restaurant")) return "restaurant"
  if (s.has("lodging") || s.has("hotel")) return "accommodation"
  if (s.has("shopping_mall") || s.has("store") || s.has("clothing_store") || s.has("department_store") || s.has("market")) return "shopping"
  if (s.has("transit_station") || s.has("train_station")) return "transport"
  return "attraction"
}

// ── 핸들러: /api/places-nearby ──────────────────────────
async function handleNearby(body) {
  const { cityId, category, lat, lng, minRating, radius: reqRadius } = body
  const center = (lat && lng) ? { lat, lng } : CITY_CENTER[cityId]
  if (!center) return { status: 400, data: { error: "Invalid cityId or coordinates" } }

  const radius = Math.max(300, Math.min(reqRadius ?? 5000, 50000))
  const maxResults = radius <= 1000 ? 10 : 20

  const includedTypes = category && CATEGORY_TYPES[category]
    ? CATEGORY_TYPES[category]
    : [...CATEGORY_TYPES.attraction, ...CATEGORY_TYPES.restaurant, ...CATEGORY_TYPES.cafe, ...CATEGORY_TYPES.shopping]

  const requestBody = {
    includedTypes,
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius,
      },
    },
    maxResultCount: maxResults,
    rankPreference: "POPULARITY",
    languageCode: "ko",
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.rating,places.types,places.formattedAddress,places.photos,places.userRatingCount,places.editorialSummary",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Google Nearby API error:", res.status, err)
    return { status: 502, data: { error: "Google Places API error", details: err } }
  }

  const data = await res.json()
  const places = (data.places ?? []).map((p) => {
    let image
    if (p.photos?.[0]) {
      image = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=400&maxHeightPx=300&key=${API_KEY}`
    }
    return {
      id: `google-${p.id}`,
      name: p.displayName?.text ?? "",
      nameEn: p.displayName?.text ?? "",
      category: mapGoogleType(p.types ?? []),
      location: { lat: p.location?.latitude ?? 0, lng: p.location?.longitude ?? 0 },
      rating: p.rating,
      ratingCount: p.userRatingCount,
      address: p.formattedAddress,
      description: p.editorialSummary?.text ?? p.formattedAddress,
      image,
      googlePlaceId: p.id,
    }
  })

  // 별점 필터링은 클라이언트에서 처리
  return { status: 200, data: { places } }
}

// ── 핸들러: /api/places-search ──────────────────────────
async function handleSearch(body) {
  const { query, cityId } = body
  if (!query) return { status: 400, data: { error: "query required" } }

  const center = CITY_CENTER[cityId] ?? CITY_CENTER.tokyo

  const requestBody = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: 20000,
      },
    },
    maxResultCount: 10,
    languageCode: "ko",
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.rating,places.types,places.formattedAddress,places.photos,places.userRatingCount,places.editorialSummary",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Google Text Search API error:", res.status, err)
    return { status: 502, data: { error: "Google Places API error", details: err } }
  }

  const data = await res.json()
  const places = (data.places ?? []).map((p) => {
    let image
    if (p.photos?.[0]) {
      image = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=400&maxHeightPx=300&key=${API_KEY}`
    }
    return {
      id: `google-${p.id}`,
      name: p.displayName?.text ?? "",
      nameEn: p.displayName?.text ?? "",
      category: mapGoogleType(p.types ?? []),
      location: { lat: p.location?.latitude ?? 0, lng: p.location?.longitude ?? 0 },
      rating: p.rating,
      ratingCount: p.userRatingCount,
      address: p.formattedAddress,
      description: p.editorialSummary?.text ?? p.formattedAddress,
      image,
      googlePlaceId: p.id,
    }
  })

  return { status: 200, data: { places } }
}

// ── 핸들러: /api/place-details ─────────────────────────
async function handlePlaceDetails(body) {
  const { placeId } = body
  if (!placeId) return { status: 400, data: { error: "placeId required" } }

  // google- 접두사가 있으면 제거
  const realPlaceId = placeId.replace(/^google-/, "")

  const res = await fetch(`https://places.googleapis.com/v1/places/${realPlaceId}?languageCode=ko`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "id,displayName,location,rating,types,formattedAddress,photos,userRatingCount,editorialSummary,reviews,regularOpeningHours,websiteUri",
    },
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Google Place Details API error:", res.status, err)
    return { status: 502, data: { error: "Google Places API error", details: err } }
  }

  const p = await res.json()
  let image
  if (p.photos?.[0]) {
    image = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=400&maxHeightPx=300&key=${API_KEY}`
  }

  const place = {
    id: `google-${p.id}`,
    name: p.displayName?.text ?? "",
    nameEn: p.displayName?.text ?? "",
    category: mapGoogleType(p.types ?? []),
    location: { lat: p.location?.latitude ?? 0, lng: p.location?.longitude ?? 0 },
    rating: p.rating,
    ratingCount: p.userRatingCount,
    address: p.formattedAddress,
    description: p.editorialSummary?.text ?? p.formattedAddress,
    image,
    googlePlaceId: p.id,
    reviews: (p.reviews ?? []).slice(0, 10).map((r) => ({
      authorName: r.authorAttribution?.displayName ?? "익명",
      rating: r.rating,
      text: r.text?.text ?? "",
      relativeTime: r.relativePublishTimeDescription ?? "",
    })),
    googleMapsUri: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    openingHours: p.regularOpeningHours?.weekdayDescriptions,
    websiteUri: p.websiteUri,
  }

  return { status: 200, data: { place } }
}

// ── HTTP 서버 ───────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Method not allowed" }))
    return
  }

  // body 읽기
  let body = ""
  for await (const chunk of req) body += chunk
  let json = {}
  try { json = JSON.parse(body) } catch { /* empty */ }

  let result
  try {
    if (req.url === "/api/places-nearby") {
      result = await handleNearby(json)
    } else if (req.url === "/api/places-search") {
      result = await handleSearch(json)
    } else if (req.url === "/api/place-details") {
      result = await handlePlaceDetails(json)
    } else {
      result = { status: 404, data: { error: "Not found" } }
    }
  } catch (e) {
    console.error("Handler error:", e)
    result = { status: 500, data: { error: e.message } }
  }

  res.writeHead(result.status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(result.data))
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`\n🚀 API dev server running at http://localhost:${PORT}`)
  console.log(`   ├─ POST /api/places-nearby   (Google Nearby Search)`)
  console.log(`   └─ POST /api/places-search   (Google Text Search)`)
  console.log(`   API Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}\n`)
})
