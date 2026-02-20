import { describe, it, expect } from "vitest"
import { encodeTrip, decodeTrip, generateShareUrl } from "@/lib/shareUtils"
import type { Trip } from "@/types/schedule"

const sampleTrip: Trip = {
  id: "trip-1",
  title: "도쿄 여행",
  cityId: "tokyo",
  startDate: "2025-03-15",
  endDate: "2025-03-17",
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      items: [
        { id: "item-1", placeId: "tokyo-sensoji", startTime: "09:00", memo: "아침 일찍!" },
        { id: "item-2", placeId: "tokyo-ichiran-asakusa" },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      items: [
        { id: "item-3", placeId: "tokyo-meiji-shrine" },
      ],
    },
  ],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
}

describe("shareUtils", () => {
  describe("encodeTrip / decodeTrip", () => {
    it("Trip을 인코딩 후 디코딩하면 원본 데이터가 복원된다", () => {
      const encoded = encodeTrip(sampleTrip)
      expect(typeof encoded).toBe("string")
      expect(encoded.length).toBeGreaterThan(0)

      const decoded = decodeTrip(encoded)
      expect(decoded).not.toBeNull()
      expect(decoded!.title).toBe("도쿄 여행")
      expect(decoded!.cityId).toBe("tokyo")
      expect(decoded!.startDate).toBe("2025-03-15")
      expect(decoded!.endDate).toBe("2025-03-17")
      expect(decoded!.days).toHaveLength(2)
      expect(decoded!.days[0].items).toHaveLength(2)
      expect(decoded!.days[0].items[0].placeId).toBe("tokyo-sensoji")
      expect(decoded!.days[0].items[0].startTime).toBe("09:00")
      expect(decoded!.days[0].items[0].memo).toBe("아침 일찍!")
      expect(decoded!.days[1].items).toHaveLength(1)
    })

    it("URL-safe 문자만 포함한다 (+, /, = 없음)", () => {
      const encoded = encodeTrip(sampleTrip)
      expect(encoded).not.toContain("+")
      expect(encoded).not.toContain("/")
      expect(encoded).not.toContain("=")
    })

    it("잘못된 문자열은 null을 반환한다", () => {
      expect(decodeTrip("invalid-base64!!!")).toBeNull()
      expect(decodeTrip("")).toBeNull()
    })
  })

  describe("generateShareUrl", () => {
    it("올바른 형식의 URL을 생성한다", () => {
      const url = generateShareUrl(sampleTrip)
      expect(url).toContain("/share/")
      expect(url).toMatch(/^https?:\/\//)
    })
  })
})
