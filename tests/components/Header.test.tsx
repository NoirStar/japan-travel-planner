import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
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
  document.documentElement.classList.remove("dark")
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

  it("다크모드 토글이 존재한다", () => {
    renderWithRouter()
    // 비로그인 상태에서 Sun/Moon 아이콘 버튼이 직접 표시됨
    const buttons = screen.getAllByRole("button")
    const darkToggle = buttons.find((btn) => btn.querySelector("svg"))
    expect(darkToggle).toBeTruthy()
  })

  it("다크모드 토글 클릭 시 dark 클래스가 추가된다", () => {
    renderWithRouter()
    // 비로그인: Sun/Moon 아이콘 버튼을 찾아 클릭
    const buttons = screen.getAllByRole("button")
    // 로그인 버튼 옆의 아이콘 버튼이 다크모드 토글
    const darkToggle = buttons.find((btn) => !btn.textContent?.includes("로그인") && !btn.textContent?.includes("플래너") && !btn.textContent?.includes("커뮤니티"))
    expect(darkToggle).toBeTruthy()
    // 기본값이 isDarkMode: true이므로 첫 클릭에 dark 클래스가 제거됨
    fireEvent.click(darkToggle!)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    fireEvent.click(darkToggle!)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})
