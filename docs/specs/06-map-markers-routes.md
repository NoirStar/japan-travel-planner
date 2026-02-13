# Feature: 06 지도 마커 & 경로 표시

## 목적
- 일정에 추가된 장소를 지도에 번호 마커로 표시한다
- 장소들을 순서대로 폴리라인(직선)으로 연결한다
- 마커 클릭 시 InfoWindow로 장소 정보를 표시한다

## 상세 요구사항
- [x] 현재 Day의 장소들이 지도에 번호 마커로 표시
- [x] 마커 간 직선 폴리라인 연결 (경로 시각화)
- [x] 마커 클릭 시 InfoWindow (장소명, 카테고리, 평점)
- [x] 장소 추가/삭제 시 마커와 경로 즉시 업데이트
- [x] 마커가 모두 보이도록 지도 자동 fitBounds
- [x] MapView에 places prop 전달 구조

## 생성/수정 파일
- `src/components/map/MapView.tsx` — 마커+폴리라인+InfoWindow 추가 (수정)
- `src/components/map/PlaceMarker.tsx` — 개별 마커 컴포넌트 (신규)
- `src/components/map/RoutePolyline.tsx` — 폴리라인 컴포넌트 (신규)
- `src/components/planner/PlannerPage.tsx` — places 전달 (수정)
- `tests/components/MapView.test.tsx` — 테스트 업데이트 (수정)

## 테스트 시나리오
- [x] 장소가 있을 때 마커가 렌더링된다
- [x] 장소가 없을 때 마커가 없다
- [x] 2개 이상 장소 시 폴리라인이 렌더링된다

## 완료 조건
- [x] 마커 + 폴리라인 + InfoWindow 구현
- [x] scheduleStore 연동
- [x] 테스트 통과
- [x] PR 생성
