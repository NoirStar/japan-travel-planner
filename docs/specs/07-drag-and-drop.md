# Feature: 07 드래그 앤 드롭 일정 순서 변경

## 목적
- 플래너 화면에서 장소 카드를 드래그하여 순서를 변경할 수 있게 한다
- 같은 Day 내 순서 변경 지원
- 터치(모바일) + 마우스 + 키보드 접근성 모두 지원

## 상세 요구사항
- [x] 장소 카드를 드래그하여 같은 Day 내에서 순서 변경
- [x] 드래그 중 시각적 피드백 (드래그 오버레이, 플레이스홀더)
- [x] 드래그 핸들 아이콘 (GripVertical)
- [x] 키보드 접근성 (Space/Enter로 드래그 시작, 화살표로 이동)
- [x] 순서 변경 시 지도 경로 실시간 업데이트 (기존 반응형 구조로 자동)

## 기술 선택
- **@dnd-kit**: React DnD 라이브러리
  - `@dnd-kit/core`: 핵심 DnD 엔진
  - `@dnd-kit/sortable`: 정렬 가능 리스트 프리셋
  - `@dnd-kit/utilities`: CSS 유틸리티

## 데이터 구조
- 기존 `scheduleStore.moveItem()` 활용 (이미 구현됨)
- `moveItem(tripId, sourceDayId, targetDayId, itemId, newIndex)`

## 컴포넌트 변경
- `SortablePlaceCard`: PlaceCard를 useSortable로 감싸는 래퍼
- `SchedulePanel`: DndContext + SortableContext로 리스트 감싸기
- `PlaceCard`: 드래그 핸들 추가 (GripVertical 아이콘)

## 테스트 시나리오
- [x] 드래그 핸들이 렌더링되는지
- [x] SortablePlaceCard가 data-testid를 올바르게 전달하는지
- [x] 드래그 중 오버레이가 표시되는지 (DragOverlay)
- [x] 기존 PlaceCard 삭제 기능 유지 확인

## 완료 조건 (Definition of Done)
- [x] 같은 Day 내 드래그 정렬 동작
- [x] 드래그 중 시각적 피드백
- [x] 접근성 (키보드) 지원
- [x] 기존 테스트 깨지지 않음
- [x] 모든 테스트 통과
