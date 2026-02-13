# Feature: 05 Day별 일정 관리 UI

## 목적
- 플래너 화면에서 Trip을 자동 생성하고 Day별 일정을 관리하는 UI를 구현한다
- 큐레이션 장소를 일정에 추가/삭제하고, Day 탭으로 전환하며, 장소 카드를 시각화한다

## 상세 요구사항
- [x] 플래너 진입 시 Trip 자동 생성 (scheduleStore 연동)
- [x] Day 탭 UI: Day 1, Day 2, ... 전환
- [x] Day 추가 / 삭제 버튼
- [x] 장소 카드: 이름, 카테고리 아이콘, 평점, 설명
- [x] 장소 삭제 버튼 (카드에서 직접)
- [x] "장소 추가" 버튼 → 큐레이션 장소 목록 시트 (하단 or 서랍)
- [x] 큐레이션 장소 목록: 카테고리 필터, 추가 버튼
- [x] Day 요약: 장소 N개 표시
- [x] 빈 상태 안내 (장소가 없을 때)

## 화면/인터랙션
- SchedulePanel 내부에 Day 탭바 + 장소 카드 리스트 구성
- "장소 추가" 클릭 → PlaceSheet 슬라이드업 (도시의 큐레이션 장소 표시)
- 카테고리 탭으로 필터링 가능
- 추가 버튼 클릭 → scheduleStore.addItem → 카드 즉시 반영

## 생성/수정 파일
- `src/components/planner/SchedulePanel.tsx` — 전면 리팩토링 (수정)
- `src/components/planner/PlannerPage.tsx` — Trip 자동 생성 로직 (수정)
- `src/components/planner/DayTabs.tsx` — Day 탭 컴포넌트 (신규)
- `src/components/planner/PlaceCard.tsx` — 장소 카드 컴포넌트 (신규)
- `src/components/planner/PlaceSheet.tsx` — 장소 추가 시트 (신규)
- `tests/components/PlannerPage.test.tsx` — 테스트 업데이트 (수정)

## 테스트 시나리오
- [x] 플래너 진입 시 Trip이 생성된다
- [x] Day 탭이 표시되고 전환된다
- [x] 장소 추가 시 카드가 렌더링된다
- [x] 장소 삭제 시 카드가 제거된다
- [x] Day 추가/삭제가 동작한다
- [x] 빈 상태 메시지가 표시된다
- [x] 카테고리 필터링이 동작한다

## 완료 조건
- [x] 스토어 연동 완료
- [x] Day 탭 + 장소 카드 + 추가 시트 구현
- [x] 테스트 통과
- [x] PR 생성
