import type { Place } from "@/types/place"

/**
 * 큐레이션 데이터 제거됨.
 * 모든 장소 데이터는 Google Places API를 통해 동적으로 로드됩니다.
 * 이 파일은 하위 호환성을 위해 빈 데이터를 반환합니다.
 */

/** 도시별 큐레이션 장소 맵 (비어 있음) */
export const placesByCity: Record<string, Place[]> = {}

/** 전체 큐레이션 장소 (비어 있음) */
export const allPlaces: Place[] = []

/** ID로 장소 찾기 (항상 undefined 반환) */
export function getPlaceById(_id: string): Place | undefined {
  return undefined
}

/** 도시 ID로 장소 목록 가져오기 (빈 배열) */
export function getPlacesByCity(_cityId: string): Place[] {
  return []
}
