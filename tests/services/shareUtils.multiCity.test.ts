import { describe, it, expect } from "vitest"
import { encodeTrip, decodeTrip } from "@/lib/shareUtils"
import type { Trip } from "@/types/schedule"

describe("shareUtils — multi-city support", () => {
  const multiCityTrip: Trip = {
    id: "trip-multi",
    title: "도쿄·교토 여행",
    cityId: "tokyo",
    startDate: "2025-04-01",
    endDate: "2025-04-03",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        cityId: "tokyo",
        items: [{ id: "item-1", placeId: "tokyo-sensoji" }],
      },
      {
        id: "day-2",
        dayNumber: 2,
        cityId: "kyoto",
        items: [{ id: "item-2", placeId: "kyoto-fushimi" }],
      },
      {
        id: "day-3",
        dayNumber: 3,
        items: [{ id: "item-3", placeId: "osaka-dotonbori" }],
      },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  }

  it("Day별 cityId가 인코딩/디코딩 후 보존된다", () => {
    const encoded = encodeTrip(multiCityTrip)
    const decoded = decodeTrip(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.days[0].cityId).toBe("tokyo")
    expect(decoded!.days[1].cityId).toBe("kyoto")
    // cityId 없는 Day는 undefined
    expect(decoded!.days[2].cityId).toBeUndefined()
  })

  it("기존 형식(cityId 없는 Day)도 정상 디코딩된다", () => {
    // cityId가 없던 레거시 형식을 시뮬레이트
    const legacyTrip: Trip = {
      id: "old-trip",
      title: "레거시 여행",
      cityId: "osaka",
      days: [
        { id: "d1", dayNumber: 1, items: [] },
      ],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }
    const encoded = encodeTrip(legacyTrip)
    const decoded = decodeTrip(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.cityId).toBe("osaka")
    expect(decoded!.days[0].cityId).toBeUndefined()
  })
})
