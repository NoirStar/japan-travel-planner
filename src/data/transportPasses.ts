/** 일본 교통 패스 정보 — 2025 기준 가격 */

export interface TransportPass {
  id: string
  name: string
  nameEn: string
  /** 유효 일수 */
  days: number
  /** 가격 (엔화) */
  price: number
  /** 해당 도시 ID 목록 (빈 배열 = 전국) */
  cityIds: string[]
  /** 설명 */
  description: string
}

export const TRANSPORT_PASSES: TransportPass[] = [
  // 전국 JR Pass
  {
    id: "jr-pass-7",
    name: "JR 패스 7일",
    nameEn: "Japan Rail Pass 7-Day",
    days: 7,
    price: 50000,
    cityIds: [],
    description: "JR 전 노선 자유석 (신칸센 포함)",
  },
  {
    id: "jr-pass-14",
    name: "JR 패스 14일",
    nameEn: "Japan Rail Pass 14-Day",
    days: 14,
    price: 80000,
    cityIds: [],
    description: "JR 전 노선 자유석 (신칸센 포함)",
  },
  {
    id: "jr-pass-21",
    name: "JR 패스 21일",
    nameEn: "Japan Rail Pass 21-Day",
    days: 21,
    price: 100000,
    cityIds: [],
    description: "JR 전 노선 자유석 (신칸센 포함)",
  },

  // 도쿄
  {
    id: "tokyo-subway-24",
    name: "도쿄 서브웨이 24시간",
    nameEn: "Tokyo Subway 24-hour Ticket",
    days: 1,
    price: 800,
    cityIds: ["tokyo"],
    description: "도쿄 메트로 + 도에이 지하철 전 노선",
  },
  {
    id: "tokyo-subway-48",
    name: "도쿄 서브웨이 48시간",
    nameEn: "Tokyo Subway 48-hour Ticket",
    days: 2,
    price: 1200,
    cityIds: ["tokyo"],
    description: "도쿄 메트로 + 도에이 지하철 전 노선",
  },
  {
    id: "tokyo-subway-72",
    name: "도쿄 서브웨이 72시간",
    nameEn: "Tokyo Subway 72-hour Ticket",
    days: 3,
    price: 1500,
    cityIds: ["tokyo"],
    description: "도쿄 메트로 + 도에이 지하철 전 노선",
  },

  // 오사카
  {
    id: "osaka-amazing-1",
    name: "오사카 어메이징 패스 1일",
    nameEn: "Osaka Amazing Pass 1-Day",
    days: 1,
    price: 2800,
    cityIds: ["osaka"],
    description: "오사카 시내 교통 무제한 + 관광지 무료입장",
  },
  {
    id: "osaka-amazing-2",
    name: "오사카 어메이징 패스 2일",
    nameEn: "Osaka Amazing Pass 2-Day",
    days: 2,
    price: 3600,
    cityIds: ["osaka"],
    description: "오사카 시내 교통 무제한 + 관광지 무료입장",
  },

  // 교토
  {
    id: "kyoto-bus-1",
    name: "교토 버스 1일권",
    nameEn: "Kyoto Bus 1-Day Pass",
    days: 1,
    price: 700,
    cityIds: ["kyoto"],
    description: "교토 시영 버스 전 노선",
  },
  {
    id: "kyoto-bus-subway-1",
    name: "교토 버스+지하철 1일권",
    nameEn: "Kyoto Bus+Subway 1-Day Pass",
    days: 1,
    price: 1100,
    cityIds: ["kyoto"],
    description: "교토 시영 버스 + 지하철 전 노선",
  },

  // 후쿠오카
  {
    id: "fukuoka-1",
    name: "후쿠오카 1일 프리패스",
    nameEn: "Fukuoka Tourist City Pass",
    days: 1,
    price: 640,
    cityIds: ["fukuoka"],
    description: "후쿠오카 시내 버스 + 지하철",
  },

  // 간사이 와이드 (오사카+교토)
  {
    id: "kansai-wide-5",
    name: "간사이 와이드 패스 5일",
    nameEn: "Kansai Wide Area Pass 5-Day",
    days: 5,
    price: 12000,
    cityIds: ["osaka", "kyoto"],
    description: "JR 간사이 광역 노선 (신칸센 자유석 포함)",
  },
]

/** 도시 간 대표 교통비 (편도, 엔화) */
export const INTERCITY_COSTS: Record<string, number> = {
  "tokyo-osaka": 14000,
  "tokyo-kyoto": 13500,
  "osaka-kyoto": 580,
  "osaka-fukuoka": 15500,
  "tokyo-fukuoka": 23000,
  "kyoto-fukuoka": 16000,
}

export function getIntercityCost(cityA: string, cityB: string): number | undefined {
  const key1 = `${cityA}-${cityB}`
  const key2 = `${cityB}-${cityA}`
  return INTERCITY_COSTS[key1] ?? INTERCITY_COSTS[key2]
}
