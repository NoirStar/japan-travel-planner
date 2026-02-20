# Feature: 09 AI 자연어 여행 추천

## 목적
- 사용자가 자유로운 텍스트("도쿄 2박3일 맛집 위주로 추천해줘")를 입력하면
  AI(OpenAI GPT)가 자체 DB 장소를 활용하여 여행 일정을 생성한다.
- 기존 단계별 위자드와 공존: 위자드 페이지에 "자유 대화" 모드를 추가한다.
- API 키는 Vercel Serverless Function에서 보호한다.

## 상세 요구사항
- [x] Vercel Serverless Function `/api/ai-recommend` 엔드포인트
- [x] OpenAI GPT-4o-mini 호출, 프롬프트에 자체 DB 장소 목록 주입
- [x] 응답을 Trip 객체로 파싱하여 프론트에 반환
- [x] 프론트: `aiRecommendService.ts` — API 호출 + 에러 처리
- [x] 위자드에 "자유 대화" 모드 추가 (텍스트 입력 → AI 응답 → 플래너 이동)
- [x] 랜딩 페이지 프롬프트가 위자드 자유대화로 연결

## 데이터 흐름
```
[사용자 프롬프트] 
    → POST /api/ai-recommend { prompt, places[] }
    → OpenAI GPT: system prompt (DB 장소 JSON) + user prompt
    → 응답 JSON: { cityId, days: [{ dayNumber, items: [{ placeId, startTime }] }] }
    → 프론트에서 Trip 객체로 변환
    → scheduleStore에 추가
    → /planner 이동
```

## API 엔드포인트

### POST /api/ai-recommend
**Request:**
```json
{
  "prompt": "도쿄 2박3일 맛집 위주로 추천해줘",
  "places": [
    { "id": "tokyo-sensoji", "name": "센소지", "category": "attraction", "cityId": "tokyo" },
    ...
  ]
}
```

**Response:**
```json
{
  "cityId": "tokyo",
  "title": "도쿄 2박3일 맛집 여행",
  "days": [
    {
      "dayNumber": 1,
      "theme": "아사쿠사 & 우에노",
      "items": [
        { "placeId": "tokyo-sensoji", "startTime": "09:00" },
        { "placeId": "tokyo-tsukiji", "startTime": "12:00" }
      ]
    }
  ],
  "summary": "맛집 중심 알찬 2박3일 코스입니다!"
}
```

## 컴포넌트 변경
- `AIChatWizard.tsx` — 하단에 텍스트 입력 바 추가 (프리톡 모드)
- `LandingPage.tsx` — prompt를 쿼리 파라미터로 전달
- `wizardStore.ts` — freePrompt 상태 추가

## 테스트 시나리오
- [x] aiRecommendService: API 호출 모킹 테스트
- [x] 위자드 프리톡 UI 렌더링 테스트
- [x] 랜딩 → 위자드 프롬프트 연동 테스트
- [x] API 에러 시 사용자 피드백

## 완료 조건
- [x] Vercel Serverless Function 구현
- [x] 프론트엔드 AI 서비스 구현
- [x] 위자드 프리톡 모드 동작
- [x] 랜딩 프롬프트 연동
- [x] 기존 테스트 유지 + 새 테스트 통과
