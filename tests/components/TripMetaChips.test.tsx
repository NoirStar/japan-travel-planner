import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TripMetaChips } from "@/components/community/TripMetaChips"
import type { TripMeta } from "@/types/community"

describe("TripMetaChips", () => {
  const fullMeta: TripMeta = {
    companionType: "couple",
    budgetBand: "mid",
    walkingIntensity: "normal",
    foodFocus: 4,
    shoppingFocus: 2,
    visitMonth: 4,
    staminaLevel: "normal",
  }

  it("메타데이터가 null이면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<TripMetaChips meta={null} />)
    expect(container.innerHTML).toBe("")
  })

  it("메타데이터가 있으면 칩들을 보여준다", () => {
    render(<TripMetaChips meta={fullMeta} />)
    expect(screen.getByText("커플")).toBeInTheDocument()
    expect(screen.getByText("🍜 맛집")).toBeInTheDocument()
  })

  it("compact 모드에서는 최대 3개 칩만 표시한다", () => {
    const { container } = render(<TripMetaChips meta={fullMeta} compact />)
    const chips = container.querySelectorAll("[class*='rounded-full']")
    // 3개 칩 + 가능한 "+N" 뱃지
    expect(chips.length).toBeLessThanOrEqual(4)
  })

  it("부분적 메타데이터도 올바르게 렌더한다", () => {
    const partial: TripMeta = { companionType: "solo" }
    render(<TripMetaChips meta={partial} />)
    expect(screen.getByText("혼자")).toBeInTheDocument()
  })
})
