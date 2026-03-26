import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/App"

describe("App", () => {
  it("랜딩 페이지가 정상 렌더링된다", () => {
    render(<App />)
    expect(screen.getByText((_, element) => element?.tagName === "P" && (element.textContent?.includes("Google Maps 기반 플래너") ?? false))).toBeInTheDocument()
  })

  it("네비게이션에 서비스 로고가 표시된다", () => {
    render(<App />)
    // Rail에 로고 아이콘이 존재
    expect(screen.getByLabelText("타비톡 홈")).toBeInTheDocument()
  })
})
