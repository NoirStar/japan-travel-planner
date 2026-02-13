import type { CityInfo } from "@/types/place"

export const cities: CityInfo[] = [
  {
    id: "tokyo",
    name: "도쿄",
    nameEn: "Tokyo",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    description: "일본의 수도, 전통과 현대의 조화",
    center: { lat: 35.6762, lng: 139.6503 },
    zoom: 12,
  },
  {
    id: "osaka",
    name: "오사카",
    nameEn: "Osaka",
    image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&h=300&fit=crop",
    description: "먹거리의 천국, 활기찬 거리",
    center: { lat: 34.6937, lng: 135.5023 },
    zoom: 12,
  },
  {
    id: "kyoto",
    name: "교토",
    nameEn: "Kyoto",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
    description: "천년의 고도, 전통 문화의 보고",
    center: { lat: 35.0116, lng: 135.7681 },
    zoom: 13,
  },
  {
    id: "fukuoka",
    name: "후쿠오카",
    nameEn: "Fukuoka",
    image: "https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=400&h=300&fit=crop",
    description: "규슈의 관문, 하카타 라멘의 본고장",
    center: { lat: 33.5904, lng: 130.4017 },
    zoom: 12,
  },
]
