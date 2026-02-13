import type { MapCenter } from "@/types/map"

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
