import { describe, it, expect, beforeEach } from "vitest"
import { useScheduleStore } from "@/stores/scheduleStore"
import { act } from "@testing-library/react"

beforeEach(() => {
  act(() => {
    useScheduleStore.setState({ trips: [], activeTripId: null })
  })
})

describe("scheduleStore — updateDayCity", () => {
  it("Day의 cityId를 변경할 수 있다", () => {
    let tripId: string
    act(() => {
      const trip = useScheduleStore.getState().createTrip("tokyo", "도쿄·교토 여행")
      tripId = trip.id
    })

    const dayId = useScheduleStore.getState().trips[0].days[0].id

    act(() => {
      useScheduleStore.getState().updateDayCity(tripId, dayId, "kyoto")
    })

    const updated = useScheduleStore.getState().trips[0].days[0]
    expect(updated.cityId).toBe("kyoto")
  })

  it("존재하지 않는 Day에 대해서는 무시한다", () => {
    act(() => {
      useScheduleStore.getState().createTrip("tokyo", "도쿄 여행")
    })

    const tripId = useScheduleStore.getState().trips[0].id

    // 에러 없이 실행되어야 함
    act(() => {
      useScheduleStore.getState().updateDayCity(tripId, "nonexistent-day", "osaka")
    })

    // 기존 Day는 변경되지 않아야 함
    expect(useScheduleStore.getState().trips[0].days[0].cityId).toBeUndefined()
  })
})
