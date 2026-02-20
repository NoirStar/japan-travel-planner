import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchAIRecommendation,
  buildTripFromAIResponse,
} from "@/services/aiRecommendService"
import type { AIRecommendResponse } from "@/services/aiRecommendService"

// ─── fetch 모킹 ─────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

const mockResponse: AIRecommendResponse = {
  cityId: "tokyo",
  title: "도쿄 2박3일 맛집 여행",
  days: [
    {
      dayNumber: 1,
      theme: "아사쿠사 & 우에노",
      items: [
        { placeId: "tokyo-sensoji", startTime: "09:00" },
        { placeId: "tokyo-tsukiji", startTime: "12:00" },
      ],
    },
    {
      dayNumber: 2,
      theme: "시부야 & 하라주쿠",
      items: [
        { placeId: "tokyo-meiji-shrine", startTime: "09:00" },
        { placeId: "tokyo-ichiran", startTime: "12:00" },
      ],
    },
  ],
  summary: "맛집 중심 알찬 2박3일 코스입니다!",
}

describe("aiRecommendService", () => {
  describe("fetchAIRecommendation", () => {
    it("성공 시 AI 응답을 반환한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await fetchAIRecommendation("도쿄 2박3일 맛집 위주")

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(result.cityId).toBe("tokyo")
      expect(result.days).toHaveLength(2)
      expect(result.title).toBe("도쿄 2박3일 맛집 여행")
    })

    it("요청 body에 prompt와 places를 포함한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await fetchAIRecommendation("오사카 맛집")

      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.prompt).toBe("오사카 맛집")
      expect(body.places).toBeDefined()
      expect(body.places.length).toBeGreaterThan(0)
    })

    it("API 오류 시 에러를 던진다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "서버 오류" }),
      })

      await expect(fetchAIRecommendation("도쿄")).rejects.toThrow("서버 오류")
    })

    it("네트워크 오류 시 에러를 던진다", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      await expect(fetchAIRecommendation("도쿄")).rejects.toThrow(
        "Network error",
      )
    })
  })

  describe("buildTripFromAIResponse", () => {
    it("AI 응답을 Trip 객체로 변환한다", () => {
      const trip = buildTripFromAIResponse(mockResponse)

      expect(trip.cityId).toBe("tokyo")
      expect(trip.title).toBe("도쿄 2박3일 맛집 여행")
      expect(trip.days).toHaveLength(2)
      expect(trip.id).toBeTruthy()
      expect(trip.createdAt).toBeTruthy()
    })

    it("Day 구조를 올바르게 변환한다", () => {
      const trip = buildTripFromAIResponse(mockResponse)

      expect(trip.days[0].dayNumber).toBe(1)
      expect(trip.days[0].items).toHaveLength(2)
      expect(trip.days[0].items[0].placeId).toBe("tokyo-sensoji")
      expect(trip.days[0].items[0].startTime).toBe("09:00")
    })

    it("각 아이템에 고유 ID를 부여한다", () => {
      const trip = buildTripFromAIResponse(mockResponse)

      const allItemIds = trip.days.flatMap((d) => d.items.map((i) => i.id))
      const uniqueIds = new Set(allItemIds)
      expect(uniqueIds.size).toBe(allItemIds.length)
    })

    it("각 Day에 고유 ID를 부여한다", () => {
      const trip = buildTripFromAIResponse(mockResponse)

      const dayIds = trip.days.map((d) => d.id)
      const uniqueIds = new Set(dayIds)
      expect(uniqueIds.size).toBe(dayIds.length)
    })
  })
})
