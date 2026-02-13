import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { PlannerPage } from "@/components/planner/PlannerPage"

// Google Maps 모킹
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: () => <div data-testid="google-map" />,
}))

function renderWithRoute(route = "/planner") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/planner" element={<PlannerPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("PlannerPage", () => {
  it("플래너 페이지가 렌더링된다", () => {
    renderWithRoute()
    expect(screen.getByTestId("planner-page")).toBeInTheDocument()
  })

  it("일정 패널이 존재한다", () => {
    renderWithRoute()
    expect(screen.getByTestId("schedule-panel")).toBeInTheDocument()
  })

  it("기본 도시명(도쿄)이 표시된다", () => {
    renderWithRoute()
    expect(screen.getByText(/도쿄 여행/)).toBeInTheDocument()
  })

  it("city=osaka 파라미터로 오사카가 표시된다", () => {
    renderWithRoute("/planner?city=osaka")
    expect(screen.getByText(/오사카 여행/)).toBeInTheDocument()
  })

  it("city=kyoto 파라미터로 교토가 표시된다", () => {
    renderWithRoute("/planner?city=kyoto")
    expect(screen.getByText(/교토 여행/)).toBeInTheDocument()
  })

  it("장소 추가 버튼이 존재한다", () => {
    renderWithRoute()
    expect(screen.getByText("장소 추가")).toBeInTheDocument()
  })

  it("AI 추천 버튼이 존재한다", () => {
    renderWithRoute()
    expect(screen.getByText("AI 추천받기")).toBeInTheDocument()
  })
})
