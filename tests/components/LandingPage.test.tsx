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
    expect(screen.getByText("나만의 완벽한 일본 여행을 계획하세요")).toBeInTheDocument()
  })

  it("AI 추천 입력창이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByLabelText("AI 추천 입력")).toBeInTheDocument()
  })

  it("추천받기 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByLabelText("추천받기")).toBeInTheDocument()
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

  it("추천받기 버튼이 항상 활성화 상태다", () => {
    renderWithRouter()
    const button = screen.getByLabelText("추천받기")
    expect(button).not.toBeDisabled()
  })

  it("추천받기 클릭 시 wizard 경로로 이동한다", () => {
    renderWithRouter()
    const button = screen.getByLabelText("추천받기")
    fireEvent.click(button)
    // 입력 없이 클릭하면 /wizard로 이동
    expect(mockNavigate).toHaveBeenCalledWith("/wizard")
  })

  it("프롬프트 입력 후 추천받기 클릭 시 쿼리 파라미터로 전달된다", () => {
    renderWithRouter()
    const input = screen.getByLabelText("AI 추천 입력")
    fireEvent.change(input, { target: { value: "도쿄 맛집 2박3일" } })
    fireEvent.click(screen.getByLabelText("추천받기"))
    expect(mockNavigate).toHaveBeenCalledWith(
      `/wizard?prompt=${encodeURIComponent("도쿄 맛집 2박3일")}`,
    )
  })

  it("Enter 키로 추천받기가 작동한다", () => {
    renderWithRouter()
    const input = screen.getByLabelText("AI 추천 입력")
    fireEvent.change(input, { target: { value: "오사카 여행" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(mockNavigate).toHaveBeenCalledWith(
      `/wizard?prompt=${encodeURIComponent("오사카 여행")}`,
    )
  })

  it("도시 카드가 키보드 접근 가능하다", () => {
    renderWithRouter()
    const tokyoCard = screen.getByText("도쿄").closest("[role='button']")
    expect(tokyoCard).toHaveAttribute("tabindex", "0")
  })
})
