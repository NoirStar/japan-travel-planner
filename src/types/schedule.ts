// ─── 예약 타입 ──────────────────────────────────────────
export const ReservationType = {
  FLIGHT: "flight",
  TRAIN: "train",
  BUS: "bus",
  ACCOMMODATION: "accommodation",
} as const

export type ReservationType =
  (typeof ReservationType)[keyof typeof ReservationType]

export const RESERVATION_LABELS: Record<ReservationType, string> = {
  [ReservationType.FLIGHT]: "항공권",
  [ReservationType.TRAIN]: "기차",
  [ReservationType.BUS]: "버스",
  [ReservationType.ACCOMMODATION]: "숙박",
}

export interface Reservation {
  id: string
  type: ReservationType
  title: string

  // 날짜/시간
  date: string                // ISO date — 탑승일 or 체크인일
  endDate?: string            // 체크아웃일 (숙박)
  startTime?: string          // HH:mm
  endTime?: string            // HH:mm

  // 교통 전용
  departureLocation?: string
  arrivalLocation?: string

  // 예약 정보
  bookingReference?: string
  provider?: string
  cost?: number               // 엔화
  memo?: string
  confirmed?: boolean
}

// ─── 일정 아이템 ────────────────────────────────────────
export interface ScheduleItem {
  id: string
  placeId: string
  /** 장소 이름 (게시글 저장 시 denormalize) */
  placeName?: string
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
  coverImage?: string
  /** ISO date string */
  startDate?: string
  /** ISO date string */
  endDate?: string
  days: DaySchedule[]
  reservations?: Reservation[]
  createdAt: string
  updatedAt: string
}
