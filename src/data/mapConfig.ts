import { cities } from "@/data/cities"
import type { CityInfo } from "@/types/place"

export const defaultCity: CityInfo = cities[0] // 도쿄

export function getCityConfig(cityId: string | null): CityInfo {
  if (!cityId) return defaultCity
  return cities.find((c) => c.id === cityId) ?? defaultCity
}
