import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { LandingPage } from "@/components/landing/LandingPage"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithRouter() {
  mockNavigate.mockReset()
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe("LandingPage", () => {
  it("히어로 타이틀이 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText("タビトーク")).toBeInTheDocument()
  })

  it("서브타이틀이 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText(/지도에서 검색하고/)).toBeInTheDocument()
  })

  it("AI 추천 입력창이 비활성화 상태로 존재한다", () => {
    renderWithRouter()
    const input = screen.getByLabelText("AI 추천 입력 (비활성화)")
    expect(input).toBeInTheDocument()
    expect(input).toBeDisabled()
  })

  it("추천받기 버튼이 비활성화 상태로 존재한다", () => {
    renderWithRouter()
    const button = screen.getByLabelText("추천받기")
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it("여행 만들기 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByText("여행 만들기")).toBeInTheDocument()
  })

  it("4개 도시 카드가 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText("도쿄")).toBeInTheDocument()
    expect(screen.getByText("오사카")).toBeInTheDocument()
    expect(screen.getByText("교토")).toBeInTheDocument()
    expect(screen.getByText("후쿠오카")).toBeInTheDocument()
  })

  it("AI 추천 준비 중 안내 메시지가 표시된다", () => {
    renderWithRouter()
    expect(screen.getByText(/AI가 추천해드리는/)).toBeInTheDocument()
  })

  it("비활성화된 추천받기 클릭 시 이동하지 않는다", () => {
    renderWithRouter()
    const button = screen.getByLabelText("추천받기")
    fireEvent.click(button)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("도시 카드가 키보드 접근 가능하다", () => {
    renderWithRouter()
    const tokyoCard = screen.getByText("도쿄").closest("[role='button']")
    expect(tokyoCard).toHaveAttribute("tabindex", "0")
  })
})
