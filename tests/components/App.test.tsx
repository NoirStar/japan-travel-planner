import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/App"

describe("App", () => {
  it("랜딩 페이지가 정상 렌더링된다", () => {
    render(<App />)
    expect(screen.getByText("나만의 완벽한 일본 여행을 계획하세요")).toBeInTheDocument()
  })

  it("헤더에 서비스명이 표시된다", () => {
    render(<App />)
    const allMatches = screen.getAllByText("타비톡")
    expect(allMatches.length).toBeGreaterThanOrEqual(1)
  })
})
