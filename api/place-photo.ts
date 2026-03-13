import type { VercelRequest, VercelResponse } from "@vercel/node"

/**
 * Place Photo Proxy — Google Places Photo URL의 API 키를 숨기기 위한 프록시 엔드포인트.
 * GET /api/place-photo?name=places/xxx/photos/yyy&maxW=400&maxH=300
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "Google API key not configured" })
  }

  const photoName = req.query.name as string | undefined
  if (!photoName || !/^places\/[^/]+\/photos\/[^/]+$/.test(photoName)) {
    return res.status(400).json({ error: "Invalid photo name" })
  }

  const maxW = Math.min(Number(req.query.maxW) || 400, 1600)
  const maxH = Math.min(Number(req.query.maxH) || 300, 1200)

  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxW}&maxHeightPx=${maxH}&key=${apiKey}`
    const photoRes = await fetch(url, { redirect: "follow" })

    if (!photoRes.ok) {
      return res.status(502).json({ error: "Photo fetch failed" })
    }

    const contentType = photoRes.headers.get("content-type") ?? "image/jpeg"
    res.setHeader("Content-Type", contentType)
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800")

    const buffer = Buffer.from(await photoRes.arrayBuffer())
    return res.status(200).send(buffer)
  } catch {
    return res.status(500).json({ error: "Photo proxy error" })
  }
}
