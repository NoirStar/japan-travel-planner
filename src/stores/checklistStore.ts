import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  category: ChecklistCategory
}

export type ChecklistCategory =
  | "documents"
  | "money"
  | "connectivity"
  | "packing"
  | "bookings"
  | "custom"

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  documents: "서류",
  money: "환전/결제",
  connectivity: "통신",
  packing: "짐 싸기",
  bookings: "예약 확인",
  custom: "기타",
}

/** 일본 여행 준비물 기본 템플릿 */
export const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id">[] = [
  // 서류
  { text: "여권 (유효기간 6개월 이상)", checked: false, category: "documents" },
  { text: "항공권 e-티켓 출력/저장", checked: false, category: "documents" },
  { text: "숙소 예약 확인서", checked: false, category: "documents" },
  { text: "해외여행자보험 가입", checked: false, category: "documents" },
  { text: "Visit Japan Web 등록", checked: false, category: "documents" },
  // 환전/결제
  { text: "엔화 환전", checked: false, category: "money" },
  { text: "해외 결제 가능 카드 확인", checked: false, category: "money" },
  { text: "교통카드(Suica/ICOCA) 준비", checked: false, category: "money" },
  // 통신
  { text: "유심/eSIM/포켓와이파이 준비", checked: false, category: "connectivity" },
  // 짐 싸기
  { text: "충전기/보조배터리", checked: false, category: "packing" },
  { text: "여행용 어댑터 (A타입)", checked: false, category: "packing" },
  { text: "우산/우비", checked: false, category: "packing" },
  { text: "상비약 (소화제, 진통제 등)", checked: false, category: "packing" },
  { text: "세면도구", checked: false, category: "packing" },
  // 예약 확인
  { text: "공항 ↔ 시내 교통편 확인", checked: false, category: "bookings" },
  { text: "레스토랑 예약 확인", checked: false, category: "bookings" },
  { text: "관광지/체험 예약 확인", checked: false, category: "bookings" },
]

let checklistCounter = 0
function nextId(): string {
  checklistCounter += 1
  return `chk-${Date.now()}-${checklistCounter}`
}

interface ChecklistState {
  items: ChecklistItem[]
  initialized: boolean
  /** 템플릿으로 초기화 (이미 초기화 되어있으면 무시) */
  initFromTemplate: () => void
  /** 개별 체크/언체크 토글 */
  toggleItem: (id: string) => void
  /** 커스텀 아이템 추가 */
  addItem: (text: string, category?: ChecklistCategory) => void
  /** 아이템 삭제 */
  removeItem: (id: string) => void
  /** 아이템 텍스트 수정 */
  updateText: (id: string, text: string) => void
  /** 전체 리셋 (템플릿으로 복원) */
  resetToTemplate: () => void
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      items: [],
      initialized: false,

      initFromTemplate: () => {
        if (get().initialized) return
        set({
          items: DEFAULT_CHECKLIST.map((item) => ({ ...item, id: nextId() })),
          initialized: true,
        })
      },

      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i,
          ),
        })),

      addItem: (text, category = "custom") =>
        set((s) => ({
          items: [...s.items, { id: nextId(), text, checked: false, category }],
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateText: (id, text) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, text } : i)),
        })),

      resetToTemplate: () =>
        set({
          items: DEFAULT_CHECKLIST.map((item) => ({ ...item, id: nextId() })),
        }),
    }),
    { name: "travel-checklist" },
  ),
)
