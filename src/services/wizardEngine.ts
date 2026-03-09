/**
 * wizardEngine — 순수 함수로 위자드 플로우를 결정한다.
 *
 * (현재 selections) → 다음 WizardStepInfo (질문 + 선택지)
 */
import type {
  WizardStepInfo,
  WizardSelections,
  WizardOption,
  DayThemeId,
} from "@/types/wizard"
import { DAY_THEMES, TRAVEL_STYLES } from "@/types/wizard"
import { cities } from "@/data/cities"
import { getPlacesByCity } from "@/data/places"
import type { PlaceCategory } from "@/types/place"

// ─── 테마 → 카테고리 매핑 ────────────────────────────────
const THEME_CATEGORIES: Record<DayThemeId, PlaceCategory[]> = {
  landmark: ["attraction"],
  "local-food": ["restaurant", "cafe"],
  shopping: ["shopping"],
  "temple-park": ["attraction", "other"],
}

// ─── 메인: 다음 스텝 계산 ────────────────────────────────
export function getNextStep(selections: WizardSelections): WizardStepInfo | null {
  // 1. 도시 선택
  if (!selections.cityId) {
    return {
      type: "city",
      question: "어디로 여행을 떠나고 싶으세요?",
      options: cities.map((c) => ({
        id: c.id,
        label: c.name,
        description: c.description,
        image: c.image,
      })),
    }
  }

  // 2. 기간 선택
  if (!selections.duration) {
    return {
      type: "duration",
      question: "며칠 여행하실 건가요?",
      options: [
        { id: "2", label: "1박 2일" },
        { id: "3", label: "2박 3일" },
        { id: "4", label: "3박 4일" },
      ],
    }
  }

  // 3. 여행 스타일
  if (!selections.styles || selections.styles.length === 0) {
    return {
      type: "style",
      question: "어떤 스타일의 여행을 좋아하세요? (여러 개 선택 가능)",
      options: TRAVEL_STYLES.map((s) => ({
        id: s.id,
        label: s.label,
      })),
      multiSelect: true,
    }
  }

  // 4~5. Day 테마 + 식사 (반복)
  for (let day = 1; day <= selections.duration; day++) {
    // Day 테마
    if (!selections.dayThemes?.[day]) {
      return {
        type: "dayTheme",
        question: `Day ${day}은 어떤 테마로 할까요?`,
        options: DAY_THEMES.map((t) => ({
          id: t.id,
          label: t.label,
          description: t.description,
        })),
        dayNumber: day,
      }
    }

    // 점심 식사
    const lunchKey = `${day}-lunch`
    if (!selections.meals?.[lunchKey]) {
      const restaurants = getMealOptions(selections.cityId, selections.dayThemes[day], "lunch")
      return {
        type: "meal",
        question: `Day ${day} 점심은 어디서 드실래요?`,
        options: restaurants,
        dayNumber: day,
        mealType: "lunch",
        skippable: true,
      }
    }

    // 저녁 식사
    const dinnerKey = `${day}-dinner`
    if (!selections.meals?.[dinnerKey]) {
      const restaurants = getMealOptions(selections.cityId, selections.dayThemes[day], "dinner")
      return {
        type: "meal",
        question: `Day ${day} 저녁은 어디서 드실래요?`,
        options: restaurants,
        dayNumber: day,
        mealType: "dinner",
        skippable: true,
      }
    }
  }

  // 6. 모든 선택 완료 → 요약
  return {
    type: "summary",
    question: "일정이 완성되었어요! 확인해주세요",
    options: [],
  }
}

// ─── 식사 선택지 생성 ────────────────────────────────────
function getMealOptions(
  cityId: string,
  _themeId: DayThemeId,
  _mealType: "lunch" | "dinner",
): WizardOption[] {
  const places = getPlacesByCity(cityId)
  const restaurants = places.filter(
    (p) => p.category === "restaurant" || p.category === "cafe",
  )
  // 이미 선택 안 된 것들 중에서 최대 4개 (셔플은 간단히)
  const shuffled = [...restaurants].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4).map((p) => ({
    id: p.id,
    label: p.name,
    description: p.description ?? "",
    rating: p.rating,
    image: p.image,
  }))
}

// ─── Day별 장소 배치 (테마 기반) ─────────────────────────
export function getPlacesForDayTheme(
  cityId: string,
  themeId: DayThemeId,
  count: number = 3,
): string[] {
  const places = getPlacesByCity(cityId)
  const categories = THEME_CATEGORIES[themeId] ?? ["attraction"]
  const filtered = places.filter((p) => categories.includes(p.category))
  const sorted = [...filtered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  return sorted.slice(0, count).map((p) => p.id)
}

// ─── AI 답변 텍스트 생성 ─────────────────────────────────
export function getAIResponseText(
  stepType: string,
  selectionLabel: string,
): string {
  switch (stepType) {
    case "city":
      return `${selectionLabel}! 멋진 선택이에요!`
    case "duration":
      return `${selectionLabel} 일정이군요! 알차게 계획해볼게요.`
    case "style":
      return `${selectionLabel} 스타일로 준비할게요!`
    case "dayTheme":
      return `${selectionLabel} 테마로 골라볼게요.`
    case "meal":
      return `${selectionLabel}, 좋은 선택이에요!`
    default:
      return "알겠어요!"
  }
}
