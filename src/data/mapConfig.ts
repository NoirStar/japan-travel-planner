import type { CityMapConfig } from "@/types/map"

export const cityMapConfigs: CityMapConfig[] = [
  {
    id: "tokyo",
    name: "도쿄",
    nameEn: "Tokyo",
    center: { lat: 35.6762, lng: 139.6503 },
    zoom: 12,
  },
  {
    id: "osaka",
    name: "오사카",
    nameEn: "Osaka",
    center: { lat: 34.6937, lng: 135.5023 },
    zoom: 12,
  },
  {
    id: "kyoto",
    name: "교토",
    nameEn: "Kyoto",
    center: { lat: 35.0116, lng: 135.7681 },
    zoom: 13,
  },
  {
    id: "fukuoka",
    name: "후쿠오카",
    nameEn: "Fukuoka",
    center: { lat: 33.5904, lng: 130.4017 },
    zoom: 12,
  },
]

export const defaultMapConfig: CityMapConfig = cityMapConfigs[0] // 도쿄

export function getCityMapConfig(cityId: string | null): CityMapConfig {
  if (!cityId) return defaultMapConfig
  return cityMapConfigs.find((c) => c.id === cityId) ?? defaultMapConfig
}
