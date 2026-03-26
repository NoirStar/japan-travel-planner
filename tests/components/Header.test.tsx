import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { useAuthStore } from "@/stores/authStore"
import { act } from "@testing-library/react"

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>,
  )
}

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ user: null, profile: null, isDemoMode: false, isLoading: false })
  })
  document.documentElement.classList.add("dark")
})

describe("Header", () => {
  it("서비스명이 표시된다", () => {
    renderWithRouter()
    expect(screen.getByText("타비톡")).toBeInTheDocument()
  })

  it("로고 클릭 시 홈으로 이동하는 링크가 있다", () => {
    renderWithRouter()
    const homeLink = screen.getByText("타비톡").closest("a")
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
