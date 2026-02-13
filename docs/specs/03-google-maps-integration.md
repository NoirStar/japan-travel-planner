# Feature: 03 Google Maps 통합

## 목적
- 플래너 화면에 Google Maps를 렌더링하여 장소 마커, 경로 등의 기반을 마련한다
- 좌측 일정 패널 + 우측 지도 레이아웃을 구성한다
- 다크모드 대응 커스텀 맵 스타일을 적용한다

## 상세 요구사항
- [x] `@vis.gl/react-google-maps` (Google 공식 React 래퍼) 설치
- [x] `.env`에 `VITE_GOOGLE_MAPS_API_KEY` 환경변수 설정
- [x] PlannerPage를 좌측 패널(일정) + 우측 지도(MapView) 2단 레이아웃으로 변경
- [x] MapView 컴포넌트: Google Maps 렌더링
- [x] 기본 중심점: 도쿄 (35.6762, 139.6503), 줌 레벨 12
- [x] URL 쿼리 파라미터 `?city=tokyo` 등에 따라 초기 중심점 변경
- [x] 다크모드 시 맵 스타일 전환
- [x] 반응형: 모바일에서는 세로 스택 (일정 위, 지도 아래)
- [x] API 키 없을 때 graceful fallback (안내 메시지)

## 화면/인터랙션
```
데스크탑:
┌──────────────────┬──────────────────────────────────────┐
│  좌측 패널 (1/3)  │        우측 지도 (2/3)                │
│  (일정 영역)      │        Google Maps                    │
│  - 추후 구현      │        - 마커/경로는 추후              │
│                   │                                       │
│  [+ 장소 추가]    │                                       │
│  [🤖 AI 추천]     │                                       │
└──────────────────┴──────────────────────────────────────┘

모바일:
┌──────────────────────┐
│  일정 패널 (상단)      │
│  (축소 가능)           │
├──────────────────────┤
│  Google Maps (하단)    │
│  (나머지 공간)         │
└──────────────────────┘
```

## 데이터 구조
```typescript
// src/types/map.ts
interface MapCenter {
  lat: number
  lng: number
}

interface CityMapConfig {
  id: string
  center: MapCenter
  zoom: number
}
```

## 사용 패키지
- `@vis.gl/react-google-maps` — Google 공식 React 래퍼

## 생성/수정 파일
- `src/components/map/MapView.tsx` — 지도 컴포넌트 (신규)
- `src/components/planner/PlannerPage.tsx` — 2단 레이아웃으로 리팩토링 (수정)
- `src/components/planner/SchedulePanel.tsx` — 좌측 일정 패널 껍데기 (신규)
- `src/data/mapConfig.ts` — 도시별 지도 설정 (신규)
- `src/types/map.ts` — 지도 관련 타입 (신규)
- `tests/components/MapView.test.tsx` — 테스트 (신규)
- `tests/components/PlannerPage.test.tsx` — 테스트 (신규)

## 테스트 시나리오
- [x] MapView 컴포넌트가 렌더링된다
- [x] API 키 미설정 시 안내 메시지가 표시된다
- [x] PlannerPage에 지도 영역이 존재한다
- [x] PlannerPage에 일정 패널이 존재한다
- [x] 도시 쿼리 파라미터에 따라 적절한 도시명이 표시된다
- [x] SchedulePanel이 렌더링된다

## 완료 조건 (Definition of Done)
- [x] `@vis.gl/react-google-maps` 설치
- [x] MapView 컴포넌트 구현 (다크모드 스타일 포함)
- [x] PlannerPage 2단 레이아웃 구현
- [x] 반응형 대응
- [x] API 키 fallback 처리
- [x] 테스트 통과
- [x] PR 생성
