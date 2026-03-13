import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
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
    expect(screen.getByText("타비톡으로 완성하세요")).toBeInTheDocument()
  })

  it("서브타이틀이 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText((_, element) => element?.tagName === "P" && (element.textContent?.includes("구글맵 기반 일정 플래너부터") ?? false))).toBeInTheDocument()
  })



  it("여행 만들기 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByText("여행 일정 만들기")).toBeInTheDocument()
  })

  it("4개 도시 카드가 렌더링된다", () => {
    renderWithRouter()
    expect(screen.getByText("도쿄")).toBeInTheDocument()
    expect(screen.getByText("오사카")).toBeInTheDocument()
    expect(screen.getByText("교토")).toBeInTheDocument()
    expect(screen.getByText("후쿠오카")).toBeInTheDocument()
  })



  it("도시 카드가 키보드 접근 가능하다", () => {
    renderWithRouter()
    // motion.button으로 변경되어 네이티브 button으로 접근 가능
    const tokyoCard = screen.getByText("도쿄").closest("button")
    expect(tokyoCard).toBeTruthy()
  })
})
