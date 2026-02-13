import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AIChatWizard } from "@/components/chat/AIChatWizard"
import { useWizardStore } from "@/stores/wizardStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { act } from "@testing-library/react"

// Google Maps 모킹
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: () => <div data-testid="google-map" />,
}))

beforeEach(() => {
  act(() => {
    useWizardStore.getState().reset()
    useScheduleStore.setState({ trips: [], activeTripId: null })
  })
})

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={["/wizard"]}>
      <Routes>
        <Route path="/wizard" element={<AIChatWizard />} />
        <Route path="/planner" element={<div data-testid="planner-page" />} />
        <Route path="/" element={<div data-testid="landing-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AIChatWizard", () => {
  it("위자드 페이지가 렌더링된다", () => {
    renderWizard()
    expect(screen.getByTestId("wizard-page")).toBeInTheDocument()
  })

  it("초기 AI 메시지가 표시된다", () => {
    renderWizard()
    expect(screen.getByText(/함께 멋진 일본 여행을 만들어볼까요/)).toBeInTheDocument()
  })

  it("도시 선택 카드 4개가 표시된다", () => {
    renderWizard()
    expect(screen.getByTestId("city-step")).toBeInTheDocument()
    expect(screen.getByTestId("city-option-tokyo")).toBeInTheDocument()
    expect(screen.getByTestId("city-option-osaka")).toBeInTheDocument()
    expect(screen.getByTestId("city-option-kyoto")).toBeInTheDocument()
    expect(screen.getByTestId("city-option-fukuoka")).toBeInTheDocument()
  })

  it("도시 선택 시 사용자 메시지가 추가되고 다음 스텝으로 진행한다", async () => {
    renderWizard()
    fireEvent.click(screen.getByTestId("city-option-tokyo"))

    // 사용자 메시지
    expect(screen.getByText("도쿄")).toBeInTheDocument()

    // 잠시 후 AI 응답 + 다음 질문 (setTimeout 때문에 waitFor 사용)
    await vi.waitFor(() => {
      expect(screen.getByTestId("duration-step")).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it("기간 선택 후 스타일 선택으로 진행한다", async () => {
    renderWizard()

    // 도시 선택
    fireEvent.click(screen.getByTestId("city-option-osaka"))
    await vi.waitFor(() => {
      expect(screen.getByTestId("duration-step")).toBeInTheDocument()
    }, { timeout: 2000 })

    // 기간 선택
    fireEvent.click(screen.getByTestId("duration-option-3"))
    await vi.waitFor(() => {
      expect(screen.getByTestId("style-step")).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it("스타일 복수 선택 후 Day 테마로 진행한다", async () => {
    renderWizard()

    // 도시 → 기간
    fireEvent.click(screen.getByTestId("city-option-tokyo"))
    await vi.waitFor(() => screen.getByTestId("duration-step"), { timeout: 2000 })
    fireEvent.click(screen.getByTestId("duration-option-2"))
    await vi.waitFor(() => screen.getByTestId("style-step"), { timeout: 2000 })

    // 스타일 선택
    fireEvent.click(screen.getByTestId("style-option-foodie"))
    fireEvent.click(screen.getByTestId("style-option-sightseeing"))
    fireEvent.click(screen.getByTestId("style-confirm"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("daytheme-step-1")).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it("돌아가기 버튼이 존재한다", () => {
    renderWizard()
    expect(screen.getByTestId("wizard-back")).toBeInTheDocument()
  })
})
