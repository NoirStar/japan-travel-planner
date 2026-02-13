import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Trip, DaySchedule, ScheduleItem } from "@/types/schedule"

// ─── 유틸: 고유 ID 생성 ─────────────────────────────────
let counter = 0
export function generateId(prefix = "id"): string {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

// ─── 스토어 인터페이스 ──────────────────────────────────
interface ScheduleState {
  trips: Trip[]
  activeTripId: string | null

  // Trip CRUD
  createTrip: (cityId: string, title?: string) => Trip
  deleteTrip: (tripId: string) => void
  setActiveTrip: (tripId: string | null) => void
  updateTrip: (tripId: string, updates: Partial<Pick<Trip, "title" | "startDate" | "endDate">>) => void

  // Day CRUD
  addDay: (tripId: string) => DaySchedule
  removeDay: (tripId: string, dayId: string) => void

  // ScheduleItem CRUD
  addItem: (tripId: string, dayId: string, placeId: string) => ScheduleItem
  removeItem: (tripId: string, dayId: string, itemId: string) => void
  moveItem: (
    tripId: string,
    sourceDayId: string,
    targetDayId: string,
    itemId: string,
    newIndex: number,
  ) => void
  updateItem: (
    tripId: string,
    dayId: string,
    itemId: string,
    updates: Partial<Pick<ScheduleItem, "startTime" | "memo">>,
  ) => void

  // 헬퍼
  getActiveTrip: () => Trip | undefined
}

// ─── 스토어 구현 ────────────────────────────────────────
export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      trips: [],
      activeTripId: null,

      // ── Trip ──────────────────────────────────────────
      createTrip: (cityId, title) => {
        const now = new Date().toISOString()
        const trip: Trip = {
          id: generateId("trip"),
          title: title ?? `${cityId} 여행`,
          cityId,
          days: [
            {
              id: generateId("day"),
              dayNumber: 1,
              items: [],
            },
          ],
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          trips: [...state.trips, trip],
          activeTripId: trip.id,
        }))
        return trip
      },

      deleteTrip: (tripId) =>
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== tripId),
          activeTripId:
            state.activeTripId === tripId ? null : state.activeTripId,
        })),

      setActiveTrip: (tripId) => set({ activeTripId: tripId }),

      updateTrip: (tripId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t,
          ),
        })),

      // ── Day ───────────────────────────────────────────
      addDay: (tripId) => {
        const trip = get().trips.find((t) => t.id === tripId)
        const nextNumber = trip ? trip.days.length + 1 : 1
        const newDay: DaySchedule = {
          id: generateId("day"),
          dayNumber: nextNumber,
          items: [],
        }
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  days: [...t.days, newDay],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }))
        return newDay
      },

      removeDay: (tripId, dayId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            const filteredDays = t.days
              .filter((d) => d.id !== dayId)
              .map((d, i) => ({ ...d, dayNumber: i + 1 }))
            return {
              ...t,
              days: filteredDays,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // ── ScheduleItem ──────────────────────────────────
      addItem: (tripId, dayId, placeId) => {
        const item: ScheduleItem = {
          id: generateId("item"),
          placeId,
        }
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId ? { ...d, items: [...d.items, item] } : d,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
        return item
      },

      removeItem: (tripId, dayId, itemId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId
                  ? { ...d, items: d.items.filter((i) => i.id !== itemId) }
                  : d,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      moveItem: (tripId, sourceDayId, targetDayId, itemId, newIndex) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t

            // 이동할 아이템 찾기
            const sourceDay = t.days.find((d) => d.id === sourceDayId)
            const item = sourceDay?.items.find((i) => i.id === itemId)
            if (!item) return t

            return {
              ...t,
              days: t.days.map((d) => {
                if (d.id === sourceDayId && d.id === targetDayId) {
                  // 같은 Day 내 이동
                  const items = d.items.filter((i) => i.id !== itemId)
                  items.splice(newIndex, 0, item)
                  return { ...d, items }
                }
                if (d.id === sourceDayId) {
                  // 원본에서 제거
                  return { ...d, items: d.items.filter((i) => i.id !== itemId) }
                }
                if (d.id === targetDayId) {
                  // 대상에 삽입
                  const items = [...d.items]
                  items.splice(newIndex, 0, item)
                  return { ...d, items }
                }
                return d
              }),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      updateItem: (tripId, dayId, itemId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      items: d.items.map((i) =>
                        i.id === itemId ? { ...i, ...updates } : i,
                      ),
                    }
                  : d,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // ── 헬퍼 ──────────────────────────────────────────
      getActiveTrip: () => {
        const state = get()
        return state.trips.find((t) => t.id === state.activeTripId)
      },
    }),
    {
      name: "schedule-store",
    },
  ),
)
