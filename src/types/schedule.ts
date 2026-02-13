// ─── 일정 아이템 ────────────────────────────────────────
export interface ScheduleItem {
  id: string
  placeId: string
  /** HH:mm 형식, e.g. "09:00" */
  startTime?: string
  memo?: string
}

// ─── 하루 일정 ──────────────────────────────────────────
export interface DaySchedule {
  id: string
  dayNumber: number // 1-based
  /** ISO date string, e.g. "2026-03-15" */
  date?: string
  items: ScheduleItem[]
}

// ─── 여행 전체 ──────────────────────────────────────────
export interface Trip {
  id: string
  title: string
  cityId: string
  /** ISO date string */
  startDate?: string
  /** ISO date string */
  endDate?: string
  days: DaySchedule[]
  createdAt: string
  updatedAt: string
}
