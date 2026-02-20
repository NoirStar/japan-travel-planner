/**
 * aiRecommendService — AI 자연어 추천 API 호출 서비스
 */
import { allPlaces } from "@/data/places"
import type { Trip, DaySchedule, ScheduleItem } from "@/types/schedule"
import { generateId } from "@/stores/scheduleStore"

// ─── 타입 ─────────────────────────────────────────────────
interface AIRecommendDayItem {
  placeId: string
  startTime: string
}

interface AIRecommendDay {
  dayNumber: number
  theme: string
  items: AIRecommendDayItem[]
}

export interface AIRecommendResponse {
  cityId: string
  title: string
  days: AIRecommendDay[]
  summary: string
}

export interface AIRecommendError {
  error: string
}

// ─── API 호출 ─────────────────────────────────────────────
const API_URL = import.meta.env.VITE_AI_API_URL || "/api/ai-recommend"

export async function fetchAIRecommendation(
  prompt: string,
): Promise<AIRecommendResponse> {
  const places = allPlaces.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    cityId: p.cityId,
    rating: p.rating,
    description: p.description,
  }))

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, places }),
  })

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as AIRecommendError
    throw new Error(errorData.error || `AI 추천 실패 (${res.status})`)
  }

  return res.json()
}

// ─── AI 응답 → Trip 변환 ──────────────────────────────────
export function buildTripFromAIResponse(response: AIRecommendResponse): Trip {
  const now = new Date().toISOString()

  const days: DaySchedule[] = response.days.map((day) => ({
    id: generateId("day"),
    dayNumber: day.dayNumber,
    items: day.items.map(
      (item): ScheduleItem => ({
        id: generateId("item"),
        placeId: item.placeId,
        startTime: item.startTime,
      }),
    ),
  }))

  return {
    id: generateId("trip"),
    title: response.title,
    cityId: response.cityId,
    days,
    createdAt: now,
    updatedAt: now,
  }
}
