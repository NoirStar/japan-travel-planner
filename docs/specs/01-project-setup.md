# Feature: 프로젝트 초기 설정

## 목적
- Vite + React + TypeScript 프로젝트 기반 구축
- Tailwind CSS + shadcn/ui + Framer Motion UI 스택 설정
- ESLint + Prettier 코드 품질 도구 설정
- Vitest + React Testing Library 테스트 환경 설정
- Zustand 상태관리 기본 세팅
- Vercel 배포 설정
- 프로젝트 폴더 구조 생성

## 상세 요구사항
- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 4 설정 (`@tailwindcss/vite`)
- [ ] shadcn/ui 초기화 및 기본 컴포넌트 추가 (Button, Card, Dialog, Input)
- [ ] Framer Motion 설치
- [ ] Zustand 설치
- [ ] path alias 설정 (`@/` → `./src/`)
- [ ] ESLint + Prettier 설정
- [ ] Vitest + @testing-library/react + jsdom 설정
- [ ] 폴더 구조 생성 (components, hooks, stores, data, types, lib)
- [ ] `.env.example` 환경변수 템플릿
- [ ] `vercel.json` SPA 라우팅 설정
- [ ] `.gitignore` 정리
- [ ] 기본 App.tsx에 "Hello World" + shadcn Button 렌더링

## 데이터 구조
없음 (초기 설정)

## API
없음 (초기 설정)

## 테스트 시나리오
- [ ] App 컴포넌트가 정상 렌더링되는지 확인
- [ ] shadcn/ui Button이 렌더링되는지 확인
- [ ] 빌드가 에러 없이 완료되는지 확인
- [ ] lint가 에러 없이 통과하는지 확인

## 완료 조건 (Definition of Done)
- [ ] `npm run dev` 로 개발 서버 정상 실행
- [ ] `npm run build` 에러 없이 빌드 완료
- [ ] `npm run test` 기본 테스트 통과
- [ ] `npm run lint` 에러 없음
- [ ] shadcn/ui Button이 화면에 렌더링됨
- [ ] 커밋 & PR 생성
