# 🗾 타비톡 TabiTalk

> AI와 대화하며 만드는 일본 여행 플래너 + 커뮤니티

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

## 주요 기능

### 🗺️ 여행 플래너

- **Google Maps 기반** 여행 경로 시각화 (Day별 색상 구분, 이동 시간 표시)
- **드래그 앤 드롭** 일정 관리 (장소 순서 변경, Day 간 이동)
- **장소 검색** — 카테고리/별점 필터, 지도 영역 검색, 텍스트 검색
- **날짜 선택** — 여행 기간 설정 후 Day별 시간대(아침~밤) 자동 생성
- **커버 이미지** — 여행 썸네일 직접 설정

### 🤖 AI 추천

- **자연어 입력** → GPT 기반 여행 코스 자동 생성
- **위자드 채팅** — 도시·일수·취향을 대화로 입력하면 맞춤 일정 생성
- Vercel Serverless Function으로 API 키 보호

### 👥 커뮤니티

- **여행 공유** — 완성된 여행 일정을 게시글로 공유, 다른 사용자의 일정 가져오기
- **자유게시판** — Tiptap 리치텍스트 에디터 (이미지, 서식, 정렬), DOMPurify XSS 방어
- **실시간 채팅** — Supabase Realtime 기반, 낙관적 업데이트, 이전 메시지 페이징
- **추천/비추천** — 게시글·댓글 투표 시스템
- **포인트/레벨** — 출석체크·글 작성·추천 받기로 포인트 적립, 12단계 레벨링

### 🔐 인증 & 프로필

- **소셜 로그인** (Google/Kakao via Supabase Auth)
- **데모 모드** — Supabase 미설정 시 localStorage 기반으로 모든 기능 체험 가능
- **프로필 관리** — 닉네임, 아바타, 레벨/포인트 통계, 다크모드

### 📱 UX

- 반응형 디자인 (모바일/태블릿/데스크탑)
- 다크모드 지원
- IME 한글 입력 대응 (Enter 키 composition 처리)
- URL 기반 여행 공유 (Base64 인코딩)
- Route-level 코드 스플리팅 (Lazy loading)

## 시작하기

### 필수 조건

- Node.js 20+
- Google Maps API Key (Places API, Maps JavaScript API 활성화)

### 설치 및 실행

```bash
git clone https://github.com/NoirStar/japan-travel-planner.git
cd japan-travel-planner
npm install
```

### 환경변수 설정

```bash
cp .env.example .env.local
```

```env
# 필수
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key

# AI 추천 (선택)
OPENAI_API_KEY=your_openai_api_key

# Supabase 연동 (선택 — 미설정시 데모 모드)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 개발 서버

```bash
npm run dev          # Vite dev server (포트 5173)
node api-dev-server.mjs  # API 프록시 서버 (포트 3001)
```

### 테스트 & 빌드

```bash
npm test           # Vitest 전체 테스트
npm run test:watch # 워치 모드
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

## 기술 스택

| 카테고리 | 기술 |
|---------|------|
| 프레임워크 | Vite 7 + React 19 + TypeScript 5.9 |
| 지도 | Google Maps JavaScript API (@vis.gl/react-google-maps) |
| UI | Tailwind CSS 4 + Radix UI + Framer Motion |
| 리치에디터 | Tiptap (이미지, 서식, 정렬, 밑줄, 색상) |
| 상태관리 | Zustand 5 (persist middleware) |
| 드래그앤드롭 | @dnd-kit/core + @dnd-kit/sortable |
| 인증/DB | Supabase (Auth, Database, Realtime) |
| API 보호 | Vercel Serverless Functions |
| 보안 | DOMPurify (XSS 방어) |
| 테스트 | Vitest + React Testing Library + jsdom |
| 배포 | Vercel |

## 프로젝트 구조

```
src/
├── components/
│   ├── ui/          # Radix 기반 공통 UI 컴포넌트
│   ├── layout/      # Header, ErrorBoundary
│   ├── landing/     # 랜딩 페이지
│   ├── planner/     # 플래너 (SchedulePanel, PlaceCard)
│   ├── map/         # Google Maps 연동 (MapView)
│   ├── chat/        # AI 위자드 채팅
│   ├── community/   # 커뮤니티 (게시판, 채팅, 여행 공유)
│   ├── auth/        # 로그인, 프로필
│   └── trips/       # 내 여행 목록
├── stores/          # Zustand 스토어 (auth, schedule, ui, wizard, dynamicPlace)
├── services/        # API 호출 (places, AI recommend, tripBuilder)
├── hooks/           # 커스텀 훅 (useMapSearch)
├── data/            # 도시/장소 큐레이션 데이터
├── types/           # TypeScript 타입 정의
└── lib/             # 유틸리티 (supabase, shareUtils, mockCommunity)

api/                 # Vercel Serverless Functions
├── ai-recommend.ts  # GPT 여행 코스 추천
├── places-nearby.ts # Google Places 주변 검색
├── places-search.ts # Google Places 텍스트 검색
└── place-details.ts # Google Places 상세 정보

supabase/
└── schema.sql       # 데이터베이스 스키마
```

## 데이터베이스 (Supabase)

주요 테이블: `profiles`, `posts`, `comments`, `post_votes`, `comment_votes`, `chat_messages`

Row Level Security(RLS) 적용 — 각 사용자는 자신의 데이터만 수정 가능, 읽기는 공개.

## 문서

- [전체 기획서](PLAN.md) — 기능 스펙, 화면 설계, 개발 가이드라인
- [기능별 스펙](docs/specs/) — 상세 기술 문서

## 라이선스

MIT
