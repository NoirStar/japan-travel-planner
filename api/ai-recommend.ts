import type { VercelRequest, VercelResponse } from "@vercel/node"

// ─── 타입 ─────────────────────────────────────────────────
interface PlaceInput {
  id: string
  name: string
  category: string
  cityId: string
  rating?: number
  description?: string
}

interface RequestBody {
  prompt: string
  places: PlaceInput[]
}

interface DayItem {
  placeId: string
  startTime: string
}

interface DayOutput {
  dayNumber: number
  theme: string
  items: DayItem[]
}

interface AIResponse {
  cityId: string
  title: string
  days: DayOutput[]
  summary: string
}

// ─── 시스템 프롬프트 ──────────────────────────────────────
function buildSystemPrompt(places: PlaceInput[]): string {
  const placeList = places
    .map(
      (p) =>
        `- ${p.id}: ${p.name} (${p.category}, ${p.cityId}${p.rating ? `, ★${p.rating}` : ""}${p.description ? `, ${p.description}` : ""})`,
    )
    .join("\n")

  return `당신은 일본 여행 전문 AI 플래너입니다.
사용자의 요청에 따라 여행 일정을 만들어주세요.

## 사용 가능한 장소 목록
아래 장소 중에서만 선택해서 일정을 만들어야 합니다. 반드시 placeId는 아래 목록에 있는 id만 사용하세요.

${placeList}

## 규칙
1. 반드시 위 목록에 있는 장소만 사용하세요 (placeId는 id 값 그대로)
2. 하루에 3~5개 장소를 배치하세요
3. 이동 동선을 고려해서 인근 장소끼리 묶으세요
4. 맛집은 자연스럽게 점심(12:00경)/저녁(18:00경)에 배치하세요
5. 관광지는 오전(09:00~11:00)/오후(14:00~16:00)에 배치하세요
6. 사용자가 도시를 지정하지 않으면 도쿄로 기본 설정하세요
7. 사용자가 기간을 지정하지 않으면 2박3일로 기본 설정하세요

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 반환하세요.

{
  "cityId": "tokyo",
  "title": "여행 제목",
  "days": [
    {
      "dayNumber": 1,
      "theme": "Day 1 테마명",
      "items": [
        { "placeId": "장소id", "startTime": "09:00" },
        { "placeId": "장소id", "startTime": "12:00" }
      ]
    }
  ],
  "summary": "일정 요약 한줄"
}`
}

// ─── 핸들러 ───────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" })
  }

  try {
    const { prompt, places } = req.body as RequestBody

    if (!prompt || !places || places.length === 0) {
      return res.status(400).json({ error: "prompt and places are required" })
    }

    const systemPrompt = buildSystemPrompt(places)

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text()
      console.error("OpenAI API error:", errorText)
      return res.status(502).json({ error: "AI 서비스 오류가 발생했습니다" })
    }

    const data = await openaiRes.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: "AI 응답이 비어있습니다" })
    }

    // JSON 파싱
    let parsed: AIResponse
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error("Failed to parse AI response:", content)
      return res.status(502).json({ error: "AI 응답을 파싱할 수 없습니다" })
    }

    // 유효한 placeId만 필터링
    const validIds = new Set(places.map((p) => p.id))
    for (const day of parsed.days) {
      day.items = day.items.filter((item) => validIds.has(item.placeId))
    }

    return res.status(200).json(parsed)
  } catch (error) {
    console.error("AI recommend error:", error)
    return res.status(500).json({ error: "서버 오류가 발생했습니다" })
  }
}
