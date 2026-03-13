# 🗾 타비톡 TabiTalk

> Google Maps 기반 일본 여행 플래너 + 여행 공유 커뮤니티

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

타비톡은 일본 여행 일정을 지도 위에서 계획하고, 링크/PDF로 공유하고, 커뮤니티에서 다른 여행자의 일정을 참고할 수 있는 프론트엔드 중심 프로젝트입니다. 현재 저장소 기준으로 플래너, 공유, 커뮤니티, 알림, 문의 기능이 구현되어 있으며, AI 추천은 별도 런타임과 데이터 조건이 필요한 실험적 기능으로 포함되어 있습니다.

## 현재 구현 상태

| 영역 | 상태 | 설명 |
| --- | --- | --- |
| 여행 플래너 | 안정 | Day 관리, 드래그 앤 드롭, 시간/메모, 예약, 공유 링크, PDF 내보내기 |
| 지도/장소 검색 | 조건부 | Google Maps/Places API 키와 `/api` 런타임이 필요 |
| 여행 공유 커뮤니티 | 안정 | 여행 게시글, 댓글, 추천/비추천, 일정 가져오기 |
| 자유게시판 | 안정 | Tiptap 에디터, 이미지 업로드, DOMPurify 렌더링 |
| 알림/실시간 채팅 | 조건부 | Supabase Realtime, RPC, RLS 설정 필요 |
| 인증/프로필 | 조건부 | Google OAuth만 구현, Supabase Auth 필요 |
| AI 추천 | 실험적 | `/api/ai-recommend` 런타임과 장소 pool이 준비되어야 함 |

## 주요 기능

### 여행 플래너

- Google Maps 기반 지도, 번호 마커, Day별 경로 표시
- 텍스트 검색, 지도 영역 검색, 카테고리/별점 필터
- 장소 클릭으로 일정 추가, 상세 정보 lazy-load, 이동 시간 추정/실시간 보강
- Day 추가/복제/삭제, 드래그 앤 드롭 정렬, 시간/메모 편집
- 항공/기차/버스/숙박 예약 관리
- URL-safe Base64 공유 링크 생성, PDF 다운로드

### 커뮤니티

- 여행 일정 공유 게시판과 자유게시판 분리
- 게시글/댓글 추천·비추천, 댓글 작성, 게시글 상세에서 일정 가져오기
- Tiptap 기반 리치 텍스트 편집기와 이미지 업로드
- 알림 드롭다운, 실시간 채팅, 문의하기 페이지
- 포인트/레벨 시스템, 출석 체크, 프로필 관리

### AI/UX

- 단계형 AI 위자드 UI
- 자연어 프롬프트 기반 일정 추천 API 연동 구조
- 반응형 레이아웃, 다크모드, 지도 다크모드
- Route-level lazy loading, Error Boundary, IME 입력 대응

## 현재 저장소 기준 주의사항

- 로그인은 **Google OAuth만** 구현되어 있습니다. README 예전 버전의 Kakao 언급은 현재 코드와 다릅니다.
- `src/data/places/index.ts`의 큐레이션 장소 데이터는 제거되어 있습니다. 장소 데이터는 현재 Google Places API 동적 검색 기준입니다.
- 단계형 AI 위자드는 UI 플로우는 구현되어 있지만, 큐레이션 데이터가 비어 있어 추천 결과 완성도가 제한됩니다.
- 자연어 AI 추천은 `/api/ai-recommend`가 필요합니다. 로컬 `api-dev-server.mjs`는 Places 계열 API만 지원합니다.
- 비로그인 상태에서도 플래너는 사용할 수 있지만, 새로고침 후 일정이 유지되지 않습니다. 일정 persist는 로그인 상태일 때만 동작합니다.
- Supabase 미설정 시 앱이 크래시하지 않도록 일부 mock/fallback 로직이 있지만, 로그인/실시간/업로드/문의 등은 제한됩니다.

## 빠른 시작

### 요구 사항

- Node.js 20+
- npm 10+
- Google Maps JavaScript API / Places API 사용 가능한 API 키

### 설치

```bash
git clone https://github.com/NoirStar/japan-travel-planner.git
cd japan-travel-planner
npm install
cp .env.example .env.local
```

### 환경변수

| 이름 | 필수 여부 | 설명 |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | 필수 | 프론트 지도 로딩용 API 키 |
| `GOOGLE_PLACES_API_KEY` | 선택 | `api/*` 또는 `api-dev-server.mjs`에서 사용할 서버 측 키 이름 |
| `VITE_GOOGLE_MAPS_LIGHT_MAP_ID` | 선택 | 라이트 모드 Cloud Map ID |
| `VITE_GOOGLE_MAPS_DARK_MAP_ID` | 선택 | 다크 모드 Cloud Map ID |
| `OPENAI_API_KEY` | 선택 | `/api/ai-recommend`에서 사용하는 OpenAI 키 |
| `VITE_SUPABASE_URL` | 선택 | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | 선택 | Supabase anon key |
| `VITE_AI_API_URL` | 선택 | 별도 AI 백엔드가 있을 때 `/api/ai-recommend` 대신 사용할 URL |

### 로컬 실행

터미널 1:

```bash
npm run dev
```

터미널 2:

```bash
node api-dev-server.mjs
```

기본 개발 포트:

- Vite: `http://localhost:5173`
- 로컬 API 서버: `http://localhost:3001`

`vite.config.ts`에서 `/api` 요청은 `3001`로 프록시됩니다.

### 로컬 API 서버가 지원하는 엔드포인트

- `POST /api/places-nearby`
- `POST /api/places-search`
- `POST /api/place-details`

`api-dev-server.mjs`는 현재 `ai-recommend`를 처리하지 않습니다. 자연어 AI 추천을 테스트하려면 아래 둘 중 하나가 필요합니다.

- Vercel에 배포된 `/api/ai-recommend`
- `VITE_AI_API_URL`로 연결한 별도 백엔드

## Supabase 설정

전체 기능을 사용하려면 Supabase Auth / Database / Realtime / Storage 구성이 필요합니다.

1. `supabase/schema.sql`을 적용합니다.
2. `supabase/migrations/*.sql`을 순서대로 적용합니다.
3. Supabase Auth에서 Google provider를 활성화합니다.
4. 앱 도메인을 OAuth redirect URL에 등록합니다.

마이그레이션에는 다음 구성이 포함되어 있습니다.

- 알림 테이블 및 `create_notification` RPC
- 게시글/댓글 투표 토글 RPC
- 문의 테이블 및 RLS
- `images` Storage 버킷 정책
- RPC `EXECUTE` 권한 부여

## 스크립트

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
npm run test:watch
```

테스트는 Vitest + React Testing Library 기반이며, 현재 테스트 파일 15개와 공통 setup 파일이 포함되어 있습니다.

## 기술 스택

| 카테고리 | 기술 |
| --- | --- |
| 프레임워크 | Vite 7, React 19, TypeScript 5.9 |
| 라우팅 | React Router 7 |
| 상태관리 | Zustand 5 |
| 스타일링 | Tailwind CSS 4, Framer Motion |
| 지도 | Google Maps JavaScript API, Places API, `@vis.gl/react-google-maps` |
| 에디터 | Tiptap |
| 드래그 앤 드롭 | `@dnd-kit/*` |
| 백엔드 연동 | Supabase Auth, Database, Realtime, Storage |
| 서버리스 API | Vercel Functions (`api/*.ts`) |
| 보안 | DOMPurify |
| PDF | `@react-pdf/renderer` |
| 테스트 | Vitest, jsdom, React Testing Library |

## 프로젝트 구조

```text
src/
  components/     UI, 플래너, 지도, 커뮤니티, 인증, 문의
  hooks/          지도 검색, 이동 시간, 알림
  services/       Places API, AI 추천, 위자드/Trip 빌더
  stores/         auth, schedule, ui, wizard, dynamic places
  lib/            Supabase, 공유 URL, PDF, 업로드, mock 데이터
  data/           도시 설정, 장소 placeholder
  types/          도메인 타입

api/              Vercel Serverless Functions
supabase/         schema.sql + migrations
tests/            컴포넌트/서비스/스토어 테스트
docs/specs/       기능별 상세 기획 문서
PLAN.md           전체 기획 문서
```

## 문서

- [PLAN.md](PLAN.md): 제품 기획, 화면 플로우, 범위 정의
- [docs/specs](docs/specs): 기능별 세부 스펙

## 라이선스

MIT
