import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { LandingPage } from "@/components/landing/LandingPage"

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe("LandingPage", () => {
  it("히어로 로고가 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByAltText("타비톡 로고")).toBeInTheDocument()
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

  it("AI 입력 후 추천받기 버튼이 활성화된다", () => {
    renderWithRouter()
    const input = screen.getByLabelText("AI 추천 입력")
    const button = screen.getByText("추천받기").closest("button")!
    expect(button).toBeDisabled()
    fireEvent.change(input, { target: { value: "도쿄 맛집" } })
    expect(button).not.toBeDisabled()
  })

  it("빈 입력에서 추천받기 버튼이 비활성화 상태다", () => {
    renderWithRouter()
    const button = screen.getByText("추천받기").closest("button")!
    expect(button).toBeDisabled()
  })

  it("도시 카드가 키보드 접근 가능하다", () => {
    renderWithRouter()
    const tokyoCard = screen.getByText("도쿄").closest("[role='button']")
    expect(tokyoCard).toHaveAttribute("tabindex", "0")
  })
})
