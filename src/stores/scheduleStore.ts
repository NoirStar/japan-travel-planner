import { create } from "zustand"
import { persist, type StorageValue } from "zustand/middleware"
import type { Trip, DaySchedule, ScheduleItem, Reservation, TripChecklistItem, ChecklistCategory, MapPreset } from "@/types/schedule"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"

// ─── 로그인 상태 확인 (순환 의존 방지용) ─────────────────
let _supabaseAuthKey: string | null = null

function isLoggedIn(): boolean {
  try {
    if (localStorage.getItem("demo_logged_in") || localStorage.getItem("admin_logged_in")) {
      return true
    }
    // Supabase 세션 확인 (키 캐싱으로 매번 스캔 방지)
    if (!_supabaseAuthKey) {
      _supabaseAuthKey = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      ) ?? ""
    }
    return _supabaseAuthKey !== "" && !!localStorage.getItem(_supabaseAuthKey)
  } catch {
    return false
  }
}

// ─── 조건부 스토리지: 로그인 시만 localStorage 사용 ──────
const authAwareStorage = {
  getItem: (name: string): StorageValue<Pick<ScheduleState, "trips" | "activeTripId">> | null => {
    if (!isLoggedIn()) return null
    const raw = localStorage.getItem(name)
    return raw ? JSON.parse(raw) : null
  },
  setItem: (name: string, value: StorageValue<Pick<ScheduleState, "trips" | "activeTripId">>) => {
    if (!isLoggedIn()) return
    localStorage.setItem(name, JSON.stringify(value))
  },
  removeItem: (name: string) => localStorage.removeItem(name),
}

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
  updateTrip: (tripId: string, updates: Partial<Pick<Trip, "title" | "coverImage" | "startDate" | "endDate" | "budget" | "cities" | "visibility">>) => void

  // Day CRUD
  addDay: (tripId: string) => DaySchedule
  removeDay: (tripId: string, dayId: string) => void
  duplicateDay: (tripId: string, dayId: string) => DaySchedule

  // ScheduleItem CRUD
  addItem: (tripId: string, dayId: string, placeId: string) => ScheduleItem
  removeItem: (tripId: string, dayId: string, itemId: string) => void
  clearDay: (tripId: string, dayId: string) => void
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
    updates: Partial<Pick<ScheduleItem, "startTime" | "memo" | "cost" | "costCategory">>,
  ) => void

  // Reservation CRUD
  addReservation: (tripId: string, data: Omit<Reservation, "id">) => Reservation
  updateReservation: (tripId: string, reservationId: string, updates: Partial<Reservation>) => void
  removeReservation: (tripId: string, reservationId: string) => void
  moveReservation: (tripId: string, reservationId: string, newIndex: number) => void

  // Wishlist (per-trip)
  addToWishlist: (tripId: string, placeId: string, memo?: string) => void
  removeFromWishlist: (tripId: string, placeId: string) => void
  isInWishlist: (tripId: string, placeId: string) => boolean
  updateWishlistMemo: (tripId: string, placeId: string, memo: string) => void

  // Checklist (per-trip)
  initChecklist: (tripId: string, template: Omit<TripChecklistItem, "id">[]) => void
  toggleChecklistItem: (tripId: string, itemId: string) => void
  addChecklistItem: (tripId: string, text: string, category?: ChecklistCategory) => void
  removeChecklistItem: (tripId: string, itemId: string) => void
  updateChecklistText: (tripId: string, itemId: string, text: string) => void
  resetChecklist: (tripId: string, template: Omit<TripChecklistItem, "id">[]) => void

  // Map Presets (per-trip)
  addMapPreset: (tripId: string, preset: Omit<MapPreset, "id">) => void
  removeMapPreset: (tripId: string, presetId: string) => void

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

      duplicateDay: (tripId, dayId) => {
        const trip = get().trips.find((t) => t.id === tripId)
        const sourceDay = trip?.days.find((d) => d.id === dayId)
        const newDay: DaySchedule = {
          id: generateId("day"),
          dayNumber: (trip?.days.length ?? 0) + 1,
          items: (sourceDay?.items ?? []).map((item) => ({
            ...item,
            id: generateId("item"),
          })),
        }
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, days: [...t.days, newDay], updatedAt: new Date().toISOString() }
              : t,
          ),
        }))
        return newDay
      },

      // ── ScheduleItem ──────────────────────────────────
      addItem: (tripId, dayId, placeId) => {
        const item: ScheduleItem = {
          id: generateId("item"),
          placeId,
        }
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            const updated = {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId ? { ...d, items: [...d.items, item] } : d,
              ),
              updatedAt: new Date().toISOString(),
            }
            // Day1 첫 아이템 → 도시 자동 감지
            const day1 = updated.days.find((d) => d.dayNumber === 1)
            if (day1 && day1.items.length > 0) {
              const firstPlace = getAnyPlaceById(day1.items[0].placeId)
              if (firstPlace?.cityId && firstPlace.cityId !== updated.cityId) {
                updated.cityId = firstPlace.cityId
              }
            }
            return updated
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

      clearDay: (tripId, dayId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId ? { ...d, items: [] } : d,
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
                  // 같은 Day 내 이동 — arrayMove 방식
                  const oldIdx = d.items.findIndex((i) => i.id === itemId)
                  if (oldIdx === -1) return d
                  const items = [...d.items]
                  const [moved] = items.splice(oldIdx, 1)
                  items.splice(newIndex, 0, moved)
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

      // ── Reservation ────────────────────────────────────
      addReservation: (tripId, data) => {
        const reservation: Reservation = {
          ...data,
          id: generateId("rsv"),
        }
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  reservations: [...(t.reservations ?? []), reservation],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }))
        return reservation
      },

      updateReservation: (tripId, reservationId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              reservations: (t.reservations ?? []).map((r) =>
                r.id === reservationId ? { ...r, ...updates } : r,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      removeReservation: (tripId, reservationId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              reservations: (t.reservations ?? []).filter((r) => r.id !== reservationId),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      moveReservation: (tripId, reservationId, newIndex) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            const list = [...(t.reservations ?? [])]
            const oldIndex = list.findIndex((r) => r.id === reservationId)
            if (oldIndex === -1) return t
            const [moved] = list.splice(oldIndex, 1)
            list.splice(newIndex, 0, moved)
            return { ...t, reservations: list, updatedAt: new Date().toISOString() }
          }),
        })),

      // ── Wishlist (per-trip) ────────────────────────────
      addToWishlist: (tripId, placeId, memo) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            if ((t.wishlist ?? []).some((w) => w.placeId === placeId)) return t
            return {
              ...t,
              wishlist: [{ placeId, addedAt: new Date().toISOString(), memo }, ...(t.wishlist ?? [])],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      removeFromWishlist: (tripId, placeId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              wishlist: (t.wishlist ?? []).filter((w) => w.placeId !== placeId),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      isInWishlist: (tripId, placeId) => {
        const trip = get().trips.find((t) => t.id === tripId)
        return (trip?.wishlist ?? []).some((w) => w.placeId === placeId)
      },

      updateWishlistMemo: (tripId, placeId, memo) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              wishlist: (t.wishlist ?? []).map((w) =>
                w.placeId === placeId ? { ...w, memo } : w,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // ── Checklist (per-trip) ───────────────────────────
      initChecklist: (tripId, template) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            if (t.checklist && t.checklist.length > 0) return t
            return {
              ...t,
              checklist: template.map((item) => ({ ...item, id: generateId("chk") })),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      toggleChecklistItem: (tripId, itemId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              checklist: (t.checklist ?? []).map((i) =>
                i.id === itemId ? { ...i, checked: !i.checked } : i,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      addChecklistItem: (tripId, text, category = "custom") =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              checklist: [...(t.checklist ?? []), { id: generateId("chk"), text, checked: false, category }],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      removeChecklistItem: (tripId, itemId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              checklist: (t.checklist ?? []).filter((i) => i.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      updateChecklistText: (tripId, itemId, text) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              checklist: (t.checklist ?? []).map((i) =>
                i.id === itemId ? { ...i, text } : i,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      resetChecklist: (tripId, template) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              checklist: template.map((item) => ({ ...item, id: generateId("chk") })),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // ── 지도 프리셋 ────────────────────────────────────
      addMapPreset: (tripId, preset) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            const existing = t.mapPresets ?? []
            if (existing.length >= 10) return t // 최대 10개
            return {
              ...t,
              mapPresets: [...existing, { ...preset, id: generateId("mp") }],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      removeMapPreset: (tripId, presetId) =>
        set((state) => ({
          trips: state.trips.map((t) => {
            if (t.id !== tripId) return t
            return {
              ...t,
              mapPresets: (t.mapPresets ?? []).filter((p) => p.id !== presetId),
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
      storage: authAwareStorage,
    },
  ),
)
