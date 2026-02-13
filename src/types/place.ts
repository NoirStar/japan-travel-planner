import type { MapCenter } from "@/types/map"

// ─── 도시 ───────────────────────────────────────────────
export interface CityInfo {
  id: string
  name: string
  nameEn: string
  image: string
  description: string
  center: MapCenter
  zoom: number
}

/** @deprecated CityCard는 CityInfo로 통합됨. 하위 호환용 alias */
export type CityCard = CityInfo

// ─── 장소 카테고리 ──────────────────────────────────────
export const PlaceCategory = {
  RESTAURANT: "restaurant",
  ATTRACTION: "attraction",
  SHOPPING: "shopping",
  ACCOMMODATION: "accommodation",
  CAFE: "cafe",
  TRANSPORT: "transport",
  OTHER: "other",
} as const

export type PlaceCategory =
  (typeof PlaceCategory)[keyof typeof PlaceCategory]

/** 카테고리 한글 라벨 */
export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  [PlaceCategory.RESTAURANT]: "맛집",
  [PlaceCategory.ATTRACTION]: "관광지",
  [PlaceCategory.SHOPPING]: "쇼핑",
  [PlaceCategory.ACCOMMODATION]: "숙소",
  [PlaceCategory.CAFE]: "카페",
  [PlaceCategory.TRANSPORT]: "교통",
  [PlaceCategory.OTHER]: "기타",
}

// ─── 장소 ───────────────────────────────────────────────
export interface Place {
  id: string
  name: string
  nameEn: string
  category: PlaceCategory
  cityId: string
  location: MapCenter
  rating?: number
  image?: string
  description?: string
  address?: string
  googlePlaceId?: string
}
