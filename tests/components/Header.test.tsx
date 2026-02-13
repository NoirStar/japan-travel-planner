import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { Header } from "@/components/layout/Header"

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>,
  )
}

describe("Header", () => {
  it("서비스명이 표시된다", () => {
    renderWithRouter()
    expect(screen.getByText("타비톡")).toBeInTheDocument()
  })

  it("로그인 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByText("로그인")).toBeInTheDocument()
  })

  it("다크모드 토글 버튼이 존재한다", () => {
    renderWithRouter()
    expect(screen.getByLabelText("다크모드 토글")).toBeInTheDocument()
  })

  it("다크모드 토글 클릭 시 dark 클래스가 추가된다", () => {
    renderWithRouter()
    const toggleButton = screen.getByLabelText("다크모드 토글")
    fireEvent.click(toggleButton)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    // 원래 상태로 복구
    fireEvent.click(toggleButton)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })
})
