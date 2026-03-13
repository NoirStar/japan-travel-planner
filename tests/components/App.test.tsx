import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/App"

describe("App", () => {
  it("랜딩 페이지가 정상 렌더링된다", () => {
    render(<App />)
    expect(screen.getByText((_, element) => element?.tagName === "P" && (element.textContent?.includes("구글맵 기반 일정 플래너부터") ?? false))).toBeInTheDocument()
  })

  it("헤더에 서비스명이 표시된다", () => {
    render(<App />)
    const allMatches = screen.getAllByText("타비톡")
    expect(allMatches.length).toBeGreaterThanOrEqual(1)
  })
})
