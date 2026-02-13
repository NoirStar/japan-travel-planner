import { describe, it, expect } from "vitest"
import { buildTripFromSelections } from "@/services/tripBuilder"
import type { WizardSelections } from "@/types/wizard"

describe("tripBuilder", () => {
  it("완성된 selections로 Trip 객체를 생성한다", () => {
    const selections: WizardSelections = {
      cityId: "tokyo",
      duration: 2,
      styles: ["foodie", "sightseeing"],
      dayThemes: { 1: "landmark", 2: "local-food" },
      meals: {
        "1-lunch": "tokyo-tsukiji",
        "1-dinner": "tokyo-ichiran",
        "2-lunch": "tokyo-tsukiji",
        "2-dinner": "__skipped__",
      },
    }

    const trip = buildTripFromSelections(selections)
    expect(trip).not.toBeNull()
    expect(trip!.cityId).toBe("tokyo")
    expect(trip!.title).toContain("도쿄")
    expect(trip!.title).toContain("1박2일")
    expect(trip!.days.length).toBe(2)
  })

  it("Day에 테마 장소와 식사 장소가 포함된다", () => {
    const selections: WizardSelections = {
      cityId: "osaka",
      duration: 2,
      styles: ["foodie"],
      dayThemes: { 1: "landmark", 2: "shopping" },
      meals: {
        "1-lunch": "osaka-dotonbori",
        "1-dinner": "osaka-kuromon",
        "2-lunch": "__skipped__",
        "2-dinner": "osaka-dotonbori",
      },
    }

    const trip = buildTripFromSelections(selections)!
    // Day 1에 장소가 있어야 함
    expect(trip.days[0].items.length).toBeGreaterThan(0)
    // 점심 placeId 확인
    const lunchItem = trip.days[0].items.find((i) => i.startTime === "12:00")
    expect(lunchItem?.placeId).toBe("osaka-dotonbori")
  })

  it("skipped 식사는 일정에 포함되지 않는다", () => {
    const selections: WizardSelections = {
      cityId: "tokyo",
      duration: 2,
      styles: ["sightseeing"],
      dayThemes: { 1: "landmark", 2: "temple-park" },
      meals: {
        "1-lunch": "__skipped__",
        "1-dinner": "__skipped__",
        "2-lunch": "__skipped__",
        "2-dinner": "__skipped__",
      },
    }

    const trip = buildTripFromSelections(selections)!
    // 식사를 모두 건너뛰어도 테마 장소는 있어야 함
    trip.days.forEach((day) => {
      const mealItems = day.items.filter(
        (i) => i.startTime === "12:00" || i.startTime === "18:00",
      )
      expect(mealItems.length).toBe(0)
    })
  })

  it("필수 필드 누락 시 null을 반환한다", () => {
    expect(buildTripFromSelections({})).toBeNull()
    expect(buildTripFromSelections({ cityId: "tokyo" })).toBeNull()
    expect(buildTripFromSelections({ cityId: "tokyo", duration: 2 })).toBeNull()
  })
})
