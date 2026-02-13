import { create } from "zustand"
import type {
  WizardStepType,
  WizardSelections,
  ChatMessage,
  TravelStyleId,
  DayThemeId,
} from "@/types/wizard"

let msgCounter = 0
function msgId(): string {
  msgCounter += 1
  return `msg-${Date.now()}-${msgCounter}`
}

// ─── 스토어 인터페이스 ──────────────────────────────────
interface WizardState {
  currentStep: WizardStepType
  selections: WizardSelections
  chatHistory: ChatMessage[]
  completed: boolean

  // 액션
  addAIMessage: (text: string) => void
  addUserMessage: (text: string) => void
  setStep: (step: WizardStepType) => void

  selectCity: (cityId: string) => void
  selectDuration: (days: number) => void
  selectStyles: (styles: TravelStyleId[]) => void
  selectDayTheme: (dayNumber: number, themeId: DayThemeId) => void
  selectMeal: (dayNumber: number, mealType: "lunch" | "dinner", placeId: string) => void
  skipMeal: (dayNumber: number, mealType: "lunch" | "dinner") => void
  setCompleted: (value: boolean) => void

  reset: () => void
}

const initialState = {
  currentStep: "city" as WizardStepType,
  selections: {} as WizardSelections,
  chatHistory: [] as ChatMessage[],
  completed: false,
}

// ─── 스토어 구현 ────────────────────────────────────────
export const useWizardStore = create<WizardState>()((set) => ({
  ...initialState,

  addAIMessage: (text) =>
    set((s) => ({
      chatHistory: [
        ...s.chatHistory,
        { id: msgId(), role: "ai", text, timestamp: Date.now() },
      ],
    })),

  addUserMessage: (text) =>
    set((s) => ({
      chatHistory: [
        ...s.chatHistory,
        { id: msgId(), role: "user", text, timestamp: Date.now() },
      ],
    })),

  setStep: (step) => set({ currentStep: step }),

  selectCity: (cityId) =>
    set((s) => ({
      selections: { ...s.selections, cityId },
    })),

  selectDuration: (days) =>
    set((s) => ({
      selections: { ...s.selections, duration: days },
    })),

  selectStyles: (styles) =>
    set((s) => ({
      selections: { ...s.selections, styles },
    })),

  selectDayTheme: (dayNumber, themeId) =>
    set((s) => ({
      selections: {
        ...s.selections,
        dayThemes: { ...s.selections.dayThemes, [dayNumber]: themeId },
      },
    })),

  selectMeal: (dayNumber, mealType, placeId) =>
    set((s) => ({
      selections: {
        ...s.selections,
        meals: { ...s.selections.meals, [`${dayNumber}-${mealType}`]: placeId },
      },
    })),

  skipMeal: (dayNumber, mealType) =>
    set((s) => ({
      selections: {
        ...s.selections,
        meals: { ...s.selections.meals, [`${dayNumber}-${mealType}`]: "__skipped__" },
      },
    })),

  setCompleted: (value) => set({ completed: value }),

  reset: () => set({ ...initialState, chatHistory: [] }),
}))
