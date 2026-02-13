import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { PlannerPage } from "@/components/planner/PlannerPage"
import { useScheduleStore } from "@/stores/scheduleStore"
import { act } from "@testing-library/react"

// Google Maps 모킹
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: () => <div data-testid="google-map" />,
}))

// 각 테스트 전 스토어 초기화
beforeEach(() => {
  act(() => {
    useScheduleStore.setState({ trips: [], activeTripId: null })
  })
})

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

  // ── Day 탭 ──────────────────────────────────────────
  it("Day 1 탭이 기본으로 표시된다", () => {
    renderWithRoute()
    expect(screen.getByTestId("day-tab-1")).toBeInTheDocument()
  })

  it("Day 추가 버튼을 클릭하면 Day 2가 생긴다", () => {
    renderWithRoute()
    fireEvent.click(screen.getByTestId("day-add-btn"))
    expect(screen.getByTestId("day-tab-2")).toBeInTheDocument()
  })

  // ── 빈 상태 ─────────────────────────────────────────
  it("장소 미추가 시 빈 상태 메시지가 표시된다", () => {
    renderWithRoute()
    expect(screen.getByText("아직 추가된 장소가 없습니다")).toBeInTheDocument()
  })

  // ── 장소 추가 시트 ──────────────────────────────────
  it("장소 추가 버튼 클릭 시 시트가 열린다", () => {
    renderWithRoute()
    fireEvent.click(screen.getByText("장소 추가"))
    expect(screen.getByTestId("place-sheet")).toBeInTheDocument()
  })

  it("시트에서 장소를 추가하면 카드가 표시된다", () => {
    renderWithRoute()
    // 시트 열기
    fireEvent.click(screen.getByText("장소 추가"))
    // 센소지 추가
    const addBtn = screen.getByTestId("place-add-tokyo-sensoji")
    fireEvent.click(addBtn)
    // 시트 닫기
    fireEvent.click(screen.getByTestId("place-sheet-backdrop"))
    // 카드가 표시됨
    expect(screen.getByText("센소지")).toBeInTheDocument()
    expect(screen.getByTestId("place-card-0")).toBeInTheDocument()
  })

  it("카테고리 필터가 동작한다", () => {
    renderWithRoute()
    fireEvent.click(screen.getByText("장소 추가"))
    const sheet = screen.getByTestId("place-sheet")

    // "맛집" 필터 클릭
    fireEvent.click(within(sheet).getByTestId("filter-restaurant"))
    const placeList = within(sheet).getByTestId("place-list")
    // 맛집만 표시되어야 함 (츠키지 외시장, 이치란)
    expect(within(placeList).getByText("츠키지 외시장")).toBeInTheDocument()
    // 관광지는 표시되지 않아야 함
    expect(within(placeList).queryByText("센소지")).not.toBeInTheDocument()
  })

  it("장소 추가 후 Day 요약이 표시된다", () => {
    renderWithRoute()
    fireEvent.click(screen.getByText("장소 추가"))
    fireEvent.click(screen.getByTestId("place-add-tokyo-sensoji"))
    fireEvent.click(screen.getByTestId("place-sheet-backdrop"))
    expect(screen.getByTestId("day-summary")).toBeInTheDocument()
    expect(screen.getByText(/장소 1개/)).toBeInTheDocument()
  })

  it("장소 카드에서 삭제 버튼을 클릭하면 카드가 제거된다", () => {
    renderWithRoute()
    // 장소 추가
    fireEvent.click(screen.getByText("장소 추가"))
    fireEvent.click(screen.getByTestId("place-add-tokyo-sensoji"))
    fireEvent.click(screen.getByTestId("place-sheet-backdrop"))
    expect(screen.getByText("센소지")).toBeInTheDocument()
    // 삭제
    fireEvent.click(screen.getByTestId("place-remove-0"))
    expect(screen.queryByText("센소지")).not.toBeInTheDocument()
    expect(screen.getByText("아직 추가된 장소가 없습니다")).toBeInTheDocument()
  })
})
