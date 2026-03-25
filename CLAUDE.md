# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TabiTalk (타비톡) — a Korean-language Japan travel planner built with React. Users plan itineraries on Google Maps, share via links/PDF, and interact through a travel community. The UI language is Korean throughout.

## Commands

```bash
npm run dev          # Vite dev server on :5173
node api-dev-server.mjs  # Local API proxy on :3001 (needed for Places API calls)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run format       # Prettier (src/**/*.{ts,tsx,css})
npm test             # Vitest (all tests, single run)
npm run test:watch   # Vitest in watch mode
npx vitest run tests/stores/scheduleStore.test.ts  # Run a single test file
```

Both `npm run dev` and `node api-dev-server.mjs` must run simultaneously for local development. Vite proxies `/api` requests to port 3001.

## Environment Variables

Required: `VITE_GOOGLE_MAPS_API_KEY`. Optional: `GOOGLE_PLACES_API_KEY` (server-side), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_LIGHT_MAP_ID`, `VITE_GOOGLE_MAPS_DARK_MAP_ID`, `OPENAI_API_KEY`, `VITE_AI_API_URL`. Copy `.env.example` to `.env.local`.

## Code Conventions

- Avoid `any`; narrow types early. Reuse types from `src/types/`.
- Unused vars prefixed with `_` (ESLint configured: `argsIgnorePattern: '^_'`).
- Keep business logic in hooks/services/stores, not in large UI components.
- Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- After changes, run type check + lint + tests before considering work complete.
- Path alias: `@/` maps to `src/` (configured in vite, vitest, and tsconfig).

## Area-Specific Guides

- [src/CLAUDE.md](src/CLAUDE.md) — Frontend: React components, stores, hooks, services, styling
- [api/CLAUDE.md](api/CLAUDE.md) — API: Vercel serverless functions and local dev server
- [supabase/CLAUDE.md](supabase/CLAUDE.md) — Database: Supabase schema, migrations, RLS, RPC
- [tests/CLAUDE.md](tests/CLAUDE.md) — Testing: Vitest setup, conventions, structure
