import type { Place } from "@/types/place"
import { tokyoPlaces } from "./tokyo"
import { osakaPlaces } from "./osaka"
import { kyotoPlaces } from "./kyoto"
import { fukuokaPlaces } from "./fukuoka"

/** 도시별 큐레이션 장소 맵 */
export const placesByCity: Record<string, Place[]> = {
  tokyo: tokyoPlaces,
  osaka: osakaPlaces,
  kyoto: kyotoPlaces,
  fukuoka: fukuokaPlaces,
}

/** 전체 큐레이션 장소 (플랫) */
export const allPlaces: Place[] = Object.values(placesByCity).flat()

/** ID로 장소 찾기 */
export function getPlaceById(id: string): Place | undefined {
  return allPlaces.find((place) => place.id === id)
}

/** 도시 ID로 장소 목록 가져오기 */
export function getPlacesByCity(cityId: string): Place[] {
  return placesByCity[cityId] ?? []
}

export { tokyoPlaces, osakaPlaces, kyotoPlaces, fukuokaPlaces }
