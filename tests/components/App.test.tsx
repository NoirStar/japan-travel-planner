import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/App"

describe("App", () => {
  it("메인 타이틀이 렌더링된다", () => {
    render(<App />)
    expect(screen.getByText("일본 여행 플래너")).toBeInTheDocument()
  })

  it("AI 추천 버튼이 렌더링된다", () => {
    render(<App />)
    expect(screen.getByText("🤖 AI에게 추천받기")).toBeInTheDocument()
  })

  it("커스텀 만들기 버튼이 렌더링된다", () => {
    render(<App />)
    expect(screen.getByText("✏️ 직접 커스텀으로 만들기")).toBeInTheDocument()
  })
})
