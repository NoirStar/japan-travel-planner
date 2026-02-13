/**
 * tripBuilder — 위자드 선택 결과를 Trip 객체로 변환
 */
import type { WizardSelections } from "@/types/wizard"
import type { Trip, DaySchedule, ScheduleItem } from "@/types/schedule"
import { getPlacesForDayTheme } from "./wizardEngine"
import { generateId } from "@/stores/scheduleStore"

export function buildTripFromSelections(selections: WizardSelections): Trip | null {
  const { cityId, duration, dayThemes, meals } = selections
  if (!cityId || !duration || !dayThemes) return null

  const now = new Date().toISOString()
  const days: DaySchedule[] = []

  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const themeId = dayThemes[dayNum]
    if (!themeId) continue

    const items: ScheduleItem[] = []

    // 1) 오전: 테마 기반 관광/쇼핑 장소 (2~3개)
    const themePlaceIds = getPlacesForDayTheme(cityId, themeId, 2)

    // 첫 번째 관광 장소 (오전)
    if (themePlaceIds[0]) {
      items.push({
        id: generateId("item"),
        placeId: themePlaceIds[0],
        startTime: "09:00",
      })
    }

    // 2) 점심
    const lunchPlaceId = meals?.[`${dayNum}-lunch`]
    if (lunchPlaceId && lunchPlaceId !== "__skipped__") {
      items.push({
        id: generateId("item"),
        placeId: lunchPlaceId,
        startTime: "12:00",
      })
    }

    // 3) 오후: 두 번째 관광 장소
    if (themePlaceIds[1]) {
      items.push({
        id: generateId("item"),
        placeId: themePlaceIds[1],
        startTime: "14:00",
      })
    }

    // 4) 저녁
    const dinnerPlaceId = meals?.[`${dayNum}-dinner`]
    if (dinnerPlaceId && dinnerPlaceId !== "__skipped__") {
      items.push({
        id: generateId("item"),
        placeId: dinnerPlaceId,
        startTime: "18:00",
      })
    }

    days.push({
      id: generateId("day"),
      dayNumber: dayNum,
      items,
    })
  }

  const cityNames: Record<string, string> = {
    tokyo: "도쿄",
    osaka: "오사카",
    kyoto: "교토",
    fukuoka: "후쿠오카",
  }

  return {
    id: generateId("trip"),
    title: `${cityNames[cityId] ?? cityId} ${duration - 1}박${duration}일 여행`,
    cityId,
    days,
    createdAt: now,
    updatedAt: now,
  }
}
