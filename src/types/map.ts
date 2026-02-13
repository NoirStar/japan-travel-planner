export interface MapCenter {
  lat: number
  lng: number
}

export interface CityMapConfig {
  id: string
  name: string
  nameEn: string
  center: MapCenter
  zoom: number
}
