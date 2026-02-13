# Feature: 04 장소 데이터 모델

## 목적
- 여행 플래너의 핵심인 **장소(Place)**, **일정(Schedule)**, **여행(Trip)** 데이터 모델을 정의한다
- 자체 큐레이션 DB (도쿄/오사카/교토/후쿠오카 인기 장소)를 구축한다
- Zustand 스토어로 여행 일정 상태를 관리한다

## 상세 요구사항
- [x] Place 타입: 장소 정보 (이름, 위치, 카테고리, 평점, 이미지 등)
- [x] ScheduleItem 타입: 일정에 배치된 장소 (시간, 메모 등)
- [x] DaySchedule 타입: 하루 일정 (날짜, 장소 목록)
- [x] Trip 타입: 전체 여행 (도시, 기간, Day별 일정)
- [x] PlaceCategory enum: 맛집, 관광지, 쇼핑, 숙소, 카페 등
- [x] 도시별 큐레이션 장소 데이터 (도시당 10~15개)
- [x] scheduleStore: 여행 일정 CRUD (Day 추가/삭제, 장소 추가/삭제/이동)
- [x] 테스트 코드

## 데이터 구조
```typescript
enum PlaceCategory {
  RESTAURANT = "restaurant",
  ATTRACTION = "attraction",
  SHOPPING = "shopping",
  ACCOMMODATION = "accommodation",
  CAFE = "cafe",
  TRANSPORT = "transport",
  OTHER = "other",
}

interface Place {
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

interface ScheduleItem {
  id: string
  placeId: string
  startTime?: string   // "09:00"
  memo?: string
}

interface DaySchedule {
  id: string
  dayNumber: number    // 1, 2, 3...
  date?: string        // "2026-03-15"
  items: ScheduleItem[]
}

interface Trip {
  id: string
  title: string
  cityId: string
  startDate?: string
  endDate?: string
  days: DaySchedule[]
  createdAt: string
  updatedAt: string
}
```

## 생성/수정 파일
- `src/types/schedule.ts` — Schedule, Trip 타입 (신규)
- `src/types/place.ts` — Place, PlaceCategory 타입 (수정)
- `src/data/places/tokyo.ts` — 도쿄 큐레이션 장소 (신규)
- `src/data/places/osaka.ts` — 오사카 큐레이션 장소 (신규)
- `src/data/places/kyoto.ts` — 교토 큐레이션 장소 (신규)
- `src/data/places/fukuoka.ts` — 후쿠오카 큐레이션 장소 (신규)
- `src/data/places/index.ts` — 통합 export (신규)
- `src/stores/scheduleStore.ts` — 여행 일정 Zustand 스토어 (신규)
- `tests/stores/scheduleStore.test.ts` — 스토어 테스트 (신규)
- `tests/data/places.test.ts` — 큐레이션 데이터 검증 (신규)

## 테스트 시나리오
- [x] Trip 생성/삭제
- [x] Day 추가/삭제
- [x] 장소 추가/삭제/순서 변경
- [x] 큐레이션 데이터가 올바른 형식인지 검증
- [x] 도시별 장소 필터링

## 완료 조건
- [x] 타입 정의 완료
- [x] 큐레이션 DB 구축 (4개 도시)
- [x] scheduleStore CRUD 구현
- [x] 테스트 통과
- [x] PR 생성
