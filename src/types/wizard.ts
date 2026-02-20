// ─── 위자드 스텝 타입 ─────────────────────────────────────
export type WizardStepType =
  | "city"
  | "duration"
  | "style"
  | "dayTheme"
  | "meal"
  | "summary"

// ─── 여행 스타일 ─────────────────────────────────────────
export const TRAVEL_STYLES = [
  { id: "foodie", label: "맛집 중심" },
  { id: "sightseeing", label: "관광 중심" },
  { id: "shopping", label: "쇼핑 중심" },
  { id: "cafe", label: "카페·감성" },
  { id: "nature", label: "힘링·자연" },
] as const

export type TravelStyleId = (typeof TRAVEL_STYLES)[number]["id"]

// ─── Day 테마 ────────────────────────────────────────────
export const DAY_THEMES = [
  { id: "landmark", label: "유명 관광지", description: "꼭 가봐야 할 인기 명소" },
  { id: "local-food", label: "로컬 맛집 투어", description: "현지인이 추천하는 맛집" },
  { id: "shopping", label: "쇼핑 스팟", description: "쇼핑 거리와 백화점" },
  { id: "temple-park", label: "공원·신사", description: "자연과 전통의 힘링" },
] as const

export type DayThemeId = (typeof DAY_THEMES)[number]["id"]

// ─── 식사 구분 ───────────────────────────────────────────
export type MealType = "lunch" | "dinner"

// ─── 채팅 메시지 ─────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: "ai" | "user"
  text: string
  timestamp: number
}

// ─── 위자드 선택 상태 ────────────────────────────────────
export interface WizardSelections {
  cityId?: string
  duration?: number // 일수 (2 = 1박2일, 3 = 2박3일, ...)
  styles?: TravelStyleId[]
  dayThemes?: Record<number, DayThemeId>      // dayNumber → themeId
  meals?: Record<string, string>              // "1-lunch" → placeId
}

// ─── 선택지 옵션 ─────────────────────────────────────────
export interface WizardOption {
  id: string
  label: string
  emoji?: string
  description?: string
  image?: string
  rating?: number
}

// ─── 위자드 스텝 정보 ────────────────────────────────────
export interface WizardStepInfo {
  type: WizardStepType
  question: string
  options: WizardOption[]
  multiSelect?: boolean
  /** dayTheme/meal 스텝에서 현재 Day 번호 */
  dayNumber?: number
  /** meal 스텝에서 식사 구분 */
  mealType?: MealType
  /** 건너뛰기 가능 여부 */
  skippable?: boolean
}
