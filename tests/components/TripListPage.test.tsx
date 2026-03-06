import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { TripListPage } from "@/components/trips/TripListPage"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"

// Reset store before each test
const resetStore = () => {
  useScheduleStore.setState({ trips: [], activeTripId: null })
}

const loginAsDemoUser = () => {
  useAuthStore.setState({
    user: { id: "demo-user-0001" } as never,
    isDemoMode: true,
  })
}

const logout = () => {
  useAuthStore.setState({ user: null, isDemoMode: false })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TripListPage />
    </MemoryRouter>,
  )
}

describe("TripListPage", () => {
  it("비로그인 시 로그인 안내를 표시한다", () => {
    resetStore()
    logout()
    renderPage()
    expect(screen.getByText("로그인이 필요합니다")).toBeInTheDocument()
  })

  it("로그인 후 빈 상태에서 안내 메시지를 표시한다", () => {
    resetStore()
    loginAsDemoUser()
    renderPage()
    expect(screen.getByText("아직 저장된 여행이 없습니다")).toBeInTheDocument()
    expect(screen.getByText("새 여행 만들기")).toBeInTheDocument()
  })

  it("저장된 여행이 있으면 목록을 표시한다", () => {
    resetStore()
    loginAsDemoUser()
    const store = useScheduleStore.getState()
    store.createTrip("tokyo", "도쿄 여행")
    store.createTrip("osaka", "오사카 여행")

    renderPage()
    expect(screen.getByText("도쿄 여행")).toBeInTheDocument()
    expect(screen.getByText("오사카 여행")).toBeInTheDocument()
  })

  it("내 여행 목록 타이틀이 표시된다", () => {
    resetStore()
    loginAsDemoUser()
    renderPage()
    expect(screen.getByText("내 여행 목록")).toBeInTheDocument()
  })
})
