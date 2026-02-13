# Feature: 08a AI 추천 위자드 (자체 DB 기반)

## 목적
- 사용자가 자유 텍스트 대신 **단계별 선택**으로 여행 일정을 만든다
- 채팅 UI 스타일: AI가 질문 → 사용자가 카드/버튼으로 선택
- Day 테마 선택 + 식사(점심/저녁)만 추가 질문하는 혼합 방식
- 완성된 일정을 요약 화면에서 확인/수정 후 플래너로 이동

## 위자드 플로우
1. **city** — 도시 선택 (4개 카드)
2. **duration** — 기간 선택 (1박2일 / 2박3일 / 3박4일)
3. **style** — 여행 스타일 복수 선택 (맛집/관광/쇼핑/카페/힐링)
4. **dayTheme** — Day N 테마 선택 (유명 관광지/로컬 맛집/쇼핑/공원·신사)
5. **meal** — Day N 점심/저녁 식당 선택 (2~4개 카드, 건너뛰기 가능)
6. **summary** — 전체 요약 + 수정 + "이대로 진행" 버튼

## 데이터 구조
- `types/wizard.ts` — WizardStep, WizardState, ChatMessage 등
- `stores/wizardStore.ts` — 위자드 전용 Zustand 스토어
- `services/wizardEngine.ts` — (현재상태) → 다음 스텝/선택지 결정
- `services/tripBuilder.ts` — 위자드 선택 → Trip 객체로 변환

## 컴포넌트
- `AIChatWizard.tsx` — 메인 컨테이너 (채팅 스크롤)
- `ChatBubble.tsx` — AI/사용자 말풍선
- `steps/CityStep.tsx` — 도시 선택 카드
- `steps/DurationStep.tsx` — 기간 선택 버튼
- `steps/StyleStep.tsx` — 여행 스타일 복수 선택
- `steps/DayThemeStep.tsx` — Day별 테마 선택
- `steps/MealStep.tsx` — 식사 장소 선택
- `TripSummary.tsx` — 일정 요약 + 수정

## 테스트 시나리오
- [x] 위자드 페이지 렌더링
- [x] 도시 선택 → 기간 → 스타일 플로우 진행
- [x] Day 테마 + 식사 선택 동작
- [x] 요약 화면에서 "이대로 진행" → 플래너 이동
- [x] wizardEngine 순수 함수 테스트
- [x] tripBuilder 변환 테스트

## 완료 조건
- [x] 위자드 전체 플로우 동작
- [x] 기존 코드 변경 최소화 (App.tsx 라우트 + 랜딩 링크)
- [x] 모든 테스트 통과
- [x] 빌드 성공
