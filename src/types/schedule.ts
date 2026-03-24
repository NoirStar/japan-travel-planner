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

// ─── 예약 첨부파일 (Feature 5) ──────────────────────────
export interface ReservationAttachment {
  /** 첨부 보관함 내 파일 경로 (fullPath) */
  storagePath: string
  /** 사용자가 보는 파일 이름 */
  fileName: string
  /** 파일 크기(바이트) */
  size?: number
  /** 업로드 시점 ISO */
  addedAt: string
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

  /** Feature 5: 예약에 연결된 첨부파일 목록 */
  attachments?: ReservationAttachment[]
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
  /** 예상 비용 (엔화) */
  cost?: number
  /** 비용 카테고리 */
  costCategory?: CostCategory
}

export type CostCategory = "food" | "transport" | "ticket" | "shopping" | "accommodation" | "other"

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  food: "식비",
  transport: "교통",
  ticket: "입장료",
  shopping: "쇼핑",
  accommodation: "숙박",
  other: "기타",
}

// ─── 하루 일정 ──────────────────────────────────────────
export interface DaySchedule {
  id: string
  dayNumber: number // 1-based
  /** ISO date string, e.g. "2026-03-15" */
  date?: string
  /** Feature 4: 해당 Day의 도시 ID (미설정 시 trip.cityId 사용) */
  cityId?: string
  items: ScheduleItem[]
}

// ─── 후보함 아이템 (여행별) ─────────────────────────────
export interface TripWishlistItem {
  placeId: string
  addedAt: string // ISO
  memo?: string
}

// ─── 준비물 아이템 (여행별) ─────────────────────────────
export type ChecklistCategory = "documents" | "money" | "connectivity" | "packing" | "bookings" | "custom"

export interface TripChecklistItem {
  id: string
  text: string
  checked: boolean
  category: ChecklistCategory
}

// ─── 여행 공개 설정 ─────────────────────────────────────
export type TripVisibility = "private" | "shared" | "public"

export const TRIP_VISIBILITY_LABELS: Record<TripVisibility, string> = {
  private: "비공개",
  shared: "링크 공유",
  public: "전체 공개",
}

// ─── 지도 검색 프리셋 ───────────────────────────────────
export interface MapPreset {
  id: string
  label: string
  lat: number
  lng: number
  zoom: number
  category?: string
}

// ─── 여행 전체 ──────────────────────────────────────────
export interface Trip {
  id: string
  title: string
  cityId: string
  /** 다중 도시 여행 시 추가 도시 ID 목록 */
  cities?: string[]
  coverImage?: string
  /** ISO date string */
  startDate?: string
  /** ISO date string */
  endDate?: string
  days: DaySchedule[]
  reservations?: Reservation[]
  /** 여행별 후보함 */
  wishlist?: TripWishlistItem[]
  /** 여행별 준비물 체크리스트 */
  checklist?: TripChecklistItem[]
  /** 여행 총 예산 (엔화) */
  budget?: number
  /** 지도 검색 프리셋 */
  mapPresets?: MapPreset[]
  /** 여행 공개 범위 */
  visibility?: TripVisibility
  /** Supabase shared_trips.id — 설정 시 공동 편집 모드 */
  sharedId?: string
  createdAt: string
  updatedAt: string
}
