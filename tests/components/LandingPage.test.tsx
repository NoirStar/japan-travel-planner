import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { LandingPage } from "@/components/landing/LandingPage"

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>,
  )
}

describe("LandingPage", () => {
  it("히어로 타이틀이 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText("🗾 일본 여행 플래너")).toBeInTheDocument()
  })

  it("서브타이틀이 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText("나만의 완벽한 일본 여행을 계획하세요")).toBeInTheDocument()
  })

  it("AI 추천 입력창이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByLabelText("AI 추천 입력")).toBeInTheDocument()
  })

  it("추천받기 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByText("추천받기")).toBeInTheDocument()
  })

  it("직접 만들기 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByText("직접 커스텀으로 만들기")).toBeInTheDocument()
  })

  it("4개 도시 카드가 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText("도쿄")).toBeInTheDocument()
    expect(screen.getByText("오사카")).toBeInTheDocument()
    expect(screen.getByText("교토")).toBeInTheDocument()
    expect(screen.getByText("후쿠오카")).toBeInTheDocument()
  })
})
