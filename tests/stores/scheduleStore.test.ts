import { describe, it, expect, beforeEach } from "vitest"
import { useScheduleStore } from "@/stores/scheduleStore"
import { act } from "@testing-library/react"

// 각 테스트 전에 스토어 초기화
beforeEach(() => {
  act(() => {
    useScheduleStore.setState({ trips: [], activeTripId: null })
  })
})

describe("scheduleStore", () => {
  // ── Trip CRUD ─────────────────────────────────────────
  describe("Trip CRUD", () => {
    it("트립을 생성하면 trips 배열에 추가되고 activeTripId가 설정된다", () => {
      let trip: ReturnType<typeof useScheduleStore.getState.createTrip>
      act(() => {
        trip = useScheduleStore.getState().createTrip("tokyo", "도쿄 여행")
      })

      const state = useScheduleStore.getState()
      expect(state.trips).toHaveLength(1)
      expect(state.trips[0].cityId).toBe("tokyo")
      expect(state.trips[0].title).toBe("도쿄 여행")
      expect(state.activeTripId).toBe(trip!.id)
      // 기본 Day 1이 생성됨
      expect(state.trips[0].days).toHaveLength(1)
      expect(state.trips[0].days[0].dayNumber).toBe(1)
    })

    it("title 없이 생성하면 기본 제목이 설정된다", () => {
      act(() => {
        useScheduleStore.getState().createTrip("osaka")
      })
      expect(useScheduleStore.getState().trips[0].title).toBe("osaka 여행")
    })

    it("트립을 삭제하면 trips에서 제거된다", () => {
      let tripId: string
      act(() => {
        const trip = useScheduleStore.getState().createTrip("tokyo")
        tripId = trip.id
      })
      act(() => {
        useScheduleStore.getState().deleteTrip(tripId!)
      })
      expect(useScheduleStore.getState().trips).toHaveLength(0)
      expect(useScheduleStore.getState().activeTripId).toBeNull()
    })

    it("활성 트립이 아닌 트립을 삭제하면 activeTripId가 유지된다", () => {
      let trip1Id: string
      act(() => {
        const trip1 = useScheduleStore.getState().createTrip("tokyo")
        trip1Id = trip1.id
        useScheduleStore.getState().createTrip("osaka")
        useScheduleStore.getState().setActiveTrip(trip1Id)
      })
      const trip2Id = useScheduleStore.getState().trips[1].id
      act(() => {
        useScheduleStore.getState().deleteTrip(trip2Id)
      })
      expect(useScheduleStore.getState().activeTripId).toBe(trip1Id!)
    })

    it("updateTrip으로 제목을 수정할 수 있다", () => {
      act(() => {
        useScheduleStore.getState().createTrip("tokyo", "원래 제목")
      })
      const tripId = useScheduleStore.getState().trips[0].id
      act(() => {
        useScheduleStore.getState().updateTrip(tripId, { title: "수정된 제목" })
      })
      expect(useScheduleStore.getState().trips[0].title).toBe("수정된 제목")
    })
  })

  // ── Day CRUD ──────────────────────────────────────────
  describe("Day CRUD", () => {
    it("addDay로 Day를 추가하면 dayNumber가 자동 증가한다", () => {
      act(() => {
        useScheduleStore.getState().createTrip("tokyo")
      })
      const tripId = useScheduleStore.getState().trips[0].id
      act(() => {
        useScheduleStore.getState().addDay(tripId)
      })
      const days = useScheduleStore.getState().trips[0].days
      expect(days).toHaveLength(2)
      expect(days[1].dayNumber).toBe(2)
    })

    it("removeDay로 Day를 삭제하면 dayNumber가 재정렬된다", () => {
      act(() => {
        useScheduleStore.getState().createTrip("tokyo")
      })
      const tripId = useScheduleStore.getState().trips[0].id
      act(() => {
        useScheduleStore.getState().addDay(tripId)
        useScheduleStore.getState().addDay(tripId)
      })
      // Day 1, 2, 3 → Day 2 삭제 → Day 1, 2(구 3)
      const day2Id = useScheduleStore.getState().trips[0].days[1].id
      act(() => {
        useScheduleStore.getState().removeDay(tripId, day2Id)
      })
      const days = useScheduleStore.getState().trips[0].days
      expect(days).toHaveLength(2)
      expect(days[0].dayNumber).toBe(1)
      expect(days[1].dayNumber).toBe(2)
    })
  })

  // ── ScheduleItem CRUD ─────────────────────────────────
  describe("ScheduleItem CRUD", () => {
    let tripId: string
    let dayId: string

    beforeEach(() => {
      act(() => {
        const trip = useScheduleStore.getState().createTrip("tokyo")
        tripId = trip.id
        dayId = trip.days[0].id
      })
    })

    it("addItem으로 장소를 일정에 추가할 수 있다", () => {
      act(() => {
        useScheduleStore.getState().addItem(tripId, dayId, "tokyo-sensoji")
      })
      const items = useScheduleStore.getState().trips[0].days[0].items
      expect(items).toHaveLength(1)
      expect(items[0].placeId).toBe("tokyo-sensoji")
    })

    it("removeItem으로 일정에서 장소를 제거할 수 있다", () => {
      let itemId: string
      act(() => {
        const item = useScheduleStore
          .getState()
          .addItem(tripId, dayId, "tokyo-sensoji")
        itemId = item.id
      })
      act(() => {
        useScheduleStore.getState().removeItem(tripId, dayId, itemId!)
      })
      expect(useScheduleStore.getState().trips[0].days[0].items).toHaveLength(0)
    })

    it("updateItem으로 시간과 메모를 수정할 수 있다", () => {
      let itemId: string
      act(() => {
        const item = useScheduleStore
          .getState()
          .addItem(tripId, dayId, "tokyo-sensoji")
        itemId = item.id
      })
      act(() => {
        useScheduleStore
          .getState()
          .updateItem(tripId, dayId, itemId!, {
            startTime: "09:00",
            memo: "아침 일찍 방문",
          })
      })
      const item = useScheduleStore.getState().trips[0].days[0].items[0]
      expect(item.startTime).toBe("09:00")
      expect(item.memo).toBe("아침 일찍 방문")
    })

    it("moveItem으로 같은 Day 내에서 순서를 변경할 수 있다", () => {
      let item1Id: string
      act(() => {
        const item1 = useScheduleStore
          .getState()
          .addItem(tripId, dayId, "tokyo-sensoji")
        item1Id = item1.id
        useScheduleStore.getState().addItem(tripId, dayId, "tokyo-meiji-shrine")
        useScheduleStore.getState().addItem(tripId, dayId, "tokyo-skytree")
      })
      // item1 (index 0) → index 2로 이동
      act(() => {
        useScheduleStore
          .getState()
          .moveItem(tripId, dayId, dayId, item1Id!, 2)
      })
      const items = useScheduleStore.getState().trips[0].days[0].items
      expect(items[0].placeId).toBe("tokyo-meiji-shrine")
      expect(items[1].placeId).toBe("tokyo-skytree")
      expect(items[2].placeId).toBe("tokyo-sensoji")
    })

    it("moveItem으로 다른 Day로 장소를 이동할 수 있다", () => {
      act(() => {
        useScheduleStore.getState().addDay(tripId)
      })
      const day2Id = useScheduleStore.getState().trips[0].days[1].id
      let itemId: string
      act(() => {
        const item = useScheduleStore
          .getState()
          .addItem(tripId, dayId, "tokyo-sensoji")
        itemId = item.id
      })
      // Day 1 → Day 2의 index 0으로 이동
      act(() => {
        useScheduleStore
          .getState()
          .moveItem(tripId, dayId, day2Id, itemId!, 0)
      })
      expect(useScheduleStore.getState().trips[0].days[0].items).toHaveLength(0)
      const day2Items = useScheduleStore.getState().trips[0].days[1].items
      expect(day2Items).toHaveLength(1)
      expect(day2Items[0].placeId).toBe("tokyo-sensoji")
    })
  })

  // ── 헬퍼 ─────────────────────────────────────────────
  describe("헬퍼", () => {
    it("getActiveTrip이 활성 트립을 반환한다", () => {
      act(() => {
        useScheduleStore.getState().createTrip("tokyo", "도쿄!")
      })
      const active = useScheduleStore.getState().getActiveTrip()
      expect(active?.title).toBe("도쿄!")
    })

    it("활성 트립이 없으면 getActiveTrip이 undefined를 반환한다", () => {
      expect(useScheduleStore.getState().getActiveTrip()).toBeUndefined()
    })
  })
})
