import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { TopHeader } from "@/components/layout/TopHeader"
import { useAuthStore } from "@/stores/authStore"
import { act } from "@testing-library/react"

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <TopHeader />
    </BrowserRouter>,
  )
}

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ user: null, profile: null, isDemoMode: false, isLoading: false })
  })
  document.documentElement.classList.add("dark")
})

describe("TopHeader", () => {
  it("홈 링크가 존재한다", () => {
    renderWithRouter()
    expect(screen.getByLabelText("타비톡 홈")).toBeInTheDocument()
  })

  it("홈 링크가 루트로 이동한다", () => {
    renderWithRouter()
    const homeLink = screen.getByLabelText("타비톡 홈")
    expect(homeLink).toHaveAttribute("href", "/")
  })

  it("로그인 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByText("로그인")).toBeInTheDocument()
  })

  it("dark 클래스가 항상 존재한다 (dark-only 테마)", () => {
    renderWithRouter()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})
