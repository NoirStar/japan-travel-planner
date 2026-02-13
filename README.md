# 🗾 타비톡 TabiTalk

> AI와 대화하며 만드는 일본 여행 플래너

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

## 기능

- 🗺️ Google Maps 기반 여행 경로 시각화
- 🤖 AI 여행 코스 추천 (OpenAI)
- 📅 Day별 시간대 일정 관리
- 🔍 장소 검색 & 카테고리 필터
- 🌙 다크모드 지원
- 📱 반응형 디자인

## 시작하기

### 필수 조건

- Node.js 20+
- Google Maps API Key

### 설치

\`\`\`bash
git clone https://github.com/NoirStar/japan-travel-planner.git
cd japan-travel-planner
npm install
\`\`\`

### 환경변수 설정

\`\`\`bash
cp .env.example .env.local
# .env.local 파일에 API 키 입력
\`\`\`

### 개발 서버

\`\`\`bash
npm run dev
\`\`\`

### 테스트

\`\`\`bash
npm test           # 전체 테스트 실행
npm run test:watch # 워치 모드
\`\`\`

### 빌드

\`\`\`bash
npm run build
npm run preview    # 빌드 결과 미리보기
\`\`\`

## 기술 스택

| 카테고리 | 기술 |
|---------|------|
| 프레임워크 | Vite + React 19 + TypeScript |
| 지도 | Google Maps (@vis.gl/react-google-maps) |
| UI | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| 상태관리 | Zustand |
| 테스트 | Vitest + React Testing Library |
| 배포 | Vercel |

## 프로젝트 구조

\`\`\`
src/
├── components/
│   ├── ui/          # shadcn/ui 기본 컴포넌트
│   ├── layout/      # Header 등 레이아웃
│   ├── landing/     # 랜딩 페이지
│   ├── planner/     # 플래너 관련
│   └── map/         # 지도 관련
├── stores/          # Zustand 스토어
├── data/            # 도시/장소 데이터
├── types/           # TypeScript 타입
├── hooks/           # 커스텀 훅
└── lib/             # 유틸리티
\`\`\`

## 문서

- [전체 기획서](PLAN.md)
- [기능별 스펙](docs/specs/)

## 라이선스

MIT
