import { describe, it, expect } from "vitest"
import { getNextStep, getPlacesForDayTheme, getAIResponseText } from "@/services/wizardEngine"
import type { WizardSelections } from "@/types/wizard"

describe("wizardEngine", () => {
  it("빈 selections에서 city 스텝을 반환한다", () => {
    const step = getNextStep({})
    expect(step).not.toBeNull()
    expect(step!.type).toBe("city")
    expect(step!.options.length).toBe(4)
  })

  it("city 선택 후 duration 스텝을 반환한다", () => {
    const step = getNextStep({ cityId: "tokyo" })
    expect(step!.type).toBe("duration")
    expect(step!.options.length).toBe(3)
  })

  it("duration 선택 후 style 스텝을 반환한다", () => {
    const step = getNextStep({ cityId: "tokyo", duration: 3 })
    expect(step!.type).toBe("style")
    expect(step!.multiSelect).toBe(true)
  })

  it("style 선택 후 dayTheme 스텝을 반환한다", () => {
    const step = getNextStep({
      cityId: "tokyo",
      duration: 2,
      styles: ["foodie"],
    })
    expect(step!.type).toBe("dayTheme")
    expect(step!.dayNumber).toBe(1)
  })

  it("dayTheme 선택 후 meal 스텝을 반환한다", () => {
    const step = getNextStep({
      cityId: "tokyo",
      duration: 2,
      styles: ["foodie"],
      dayThemes: { 1: "landmark" },
    })
    expect(step!.type).toBe("meal")
    expect(step!.dayNumber).toBe(1)
    expect(step!.mealType).toBe("lunch")
    expect(step!.skippable).toBe(true)
  })

  it("모든 Day 완료 후 summary를 반환한다", () => {
    const selections: WizardSelections = {
      cityId: "tokyo",
      duration: 2,
      styles: ["foodie"],
      dayThemes: { 1: "landmark", 2: "local-food" },
      meals: {
        "1-lunch": "tokyo-sensoji",
        "1-dinner": "tokyo-sensoji",
        "2-lunch": "tokyo-sensoji",
        "2-dinner": "tokyo-sensoji",
      },
    }
    const step = getNextStep(selections)
    expect(step!.type).toBe("summary")
  })

  it("getPlacesForDayTheme이 장소 ID 배열을 반환한다", () => {
    const placeIds = getPlacesForDayTheme("tokyo", "landmark", 2)
    expect(placeIds.length).toBeLessThanOrEqual(2)
    expect(placeIds.length).toBeGreaterThan(0)
    placeIds.forEach((id) => expect(id).toContain("tokyo"))
  })

  it("getAIResponseText가 적절한 텍스트를 반환한다", () => {
    expect(getAIResponseText("city", "도쿄")).toContain("도쿄")
    expect(getAIResponseText("duration", "2박 3일")).toContain("2박 3일")
    expect(getAIResponseText("meal", "이치란")).toContain("이치란")
  })
})
