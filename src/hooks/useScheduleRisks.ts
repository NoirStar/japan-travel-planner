import { useMemo } from "react"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import type { Trip } from "@/types/schedule"

export type RiskLevel = "warning" | "info"

export interface ScheduleRisk {
  id: string
  level: RiskLevel
  message: string
  dayNumber?: number
  /** 관련 장소 ID (있으면) */
  placeId?: string
}

/** 하루 최대 추천 장소 수 */
const MAX_PLACES_PER_DAY = 6
/** 단일 구간 이동시간 경고 임계값 (분) */
const LONG_TRAVEL_THRESHOLD = 60
/** 하루 총 이동시간 경고 임계값 (분) */
const TOTAL_TRAVEL_DAILY_THRESHOLD = 180
/** 낮은 평점 임계값 */
const LOW_RATING_THRESHOLD = 3.5

interface TravelData {
  minutes: number
  mode: string
  distanceKm: number
}

export function useScheduleRisks(
  trip: Trip | undefined,
  travelDataByDay?: Map<number, Map<number, TravelData>>,
): ScheduleRisk[] {
  return useMemo(() => {
    if (!trip) return []

    const risks: ScheduleRisk[] = []

    for (const day of trip.days) {
      const dayNum = day.dayNumber

      // 1. Day 과밀 — 장소 너무 많음
      if (day.items.length > MAX_PLACES_PER_DAY) {
        risks.push({
          id: `overcrowded-day-${dayNum}`,
          level: "warning",
          message: `Day ${dayNum}에 장소가 ${day.items.length}개로 과밀합니다 (권장 ${MAX_PLACES_PER_DAY}개 이하)`,
          dayNumber: dayNum,
        })
      }

      // 2. 빈 Day — 장소 없음
      if (day.items.length === 0) {
        risks.push({
          id: `empty-day-${dayNum}`,
          level: "info",
          message: `Day ${dayNum}에 아직 장소가 없습니다`,
          dayNumber: dayNum,
        })
      }

      // 3. 시간 미설정 비율 높음
      if (day.items.length >= 2) {
        const noTimeCount = day.items.filter((item) => !item.startTime).length
        if (noTimeCount === day.items.length) {
          risks.push({
            id: `no-times-day-${dayNum}`,
            level: "info",
            message: `Day ${dayNum}의 모든 장소에 시간이 설정되지 않았습니다`,
            dayNumber: dayNum,
          })
        }
      }

      // 4. 낮은 평점 장소
      for (const item of day.items) {
        const place = getAnyPlaceById(item.placeId)
        if (place?.rating && place.rating < LOW_RATING_THRESHOLD) {
          risks.push({
            id: `low-rating-${item.placeId}`,
            level: "info",
            message: `Day ${dayNum} "${place.name}" 평점이 ${place.rating}으로 낮습니다`,
            dayNumber: dayNum,
            placeId: item.placeId,
          })
        }
      }

      // 5. 이동시간 기반 분석 (현재 Day의 travelDataMap이 있으면)
      const dayTravel = travelDataByDay?.get(dayNum)
      if (dayTravel) {
        let totalMinutes = 0
        for (const [, data] of dayTravel) {
          totalMinutes += data.minutes
          // 단일 구간 과다 이동
          if (data.minutes >= LONG_TRAVEL_THRESHOLD) {
            risks.push({
              id: `long-travel-day${dayNum}-seg${totalMinutes}`,
              level: "warning",
              message: `Day ${dayNum}에 ${data.minutes}분 이동 구간이 있습니다 — 동선 확인을 추천합니다`,
              dayNumber: dayNum,
            })
          }
        }
        // 하루 총 이동시간 과다
        if (totalMinutes >= TOTAL_TRAVEL_DAILY_THRESHOLD) {
          const hours = Math.floor(totalMinutes / 60)
          const mins = totalMinutes % 60
          risks.push({
            id: `total-travel-day-${dayNum}`,
            level: "warning",
            message: `Day ${dayNum} 총 이동시간 ${hours}시간 ${mins}분 — 일정 간소화를 검토하세요`,
            dayNumber: dayNum,
          })
        }
      }
    }

    return risks
  }, [trip, travelDataByDay])
}
