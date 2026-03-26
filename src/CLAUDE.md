# src/CLAUDE.md — Frontend

## Stack

React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4. Routing via React Router 7 with route-level lazy loading (`lazy()` + `lazyRetry` in `App.tsx` for stale-chunk resilience after deploys).

## State Management

Zustand stores in `stores/`:
- `scheduleStore` — itinerary state (days, items, drag-and-drop operations)
- `authStore` — Supabase auth, Google OAuth session, profile
- `uiStore` — modals, theme (light/dark), sidebar state
- `wizardStore` — AI step-wizard flow state
- `dynamicPlaceStore` — Google Places API response cache
- `wishlistStore`, `checklistStore` — user-local feature stores

## Services (`services/`)

API integration layer, separated from UI:
- `placesService` — Google Places API calls (nearby, search, details) through `/api` proxy
- `aiRecommendService` — AI itinerary recommendation via `/api/ai-recommend`
- `tripSyncService` / `userTripSync` — Supabase CRUD for saved trips
- `wizardEngine` / `tripBuilder` — AI wizard logic, builds schedule from wizard answers
- `tripChatService` — realtime collaborative chat

## Hooks (`hooks/`)

- `useMapSearch` — map viewport-based place search
- `useTravelTimes` — transit time estimates between places (Google Directions)
- `useNotifications` — Supabase Realtime subscription for notification feed
- `useCollaborativeSync` — multi-user trip editing via Supabase Realtime
- `useUserTripSync` — syncs local schedule with Supabase on auth state change
- `useSessionState` — persists transient UI state across navigation
- `useScheduleRisks` — validates schedule for timing conflicts

## Components

Domain-grouped directories:
- `planner/` — `PlannerPage` (main split-pane), day management, schedule items, reservations, share/PDF export
- `map/` — Google Maps integration via `@vis.gl/react-google-maps`, markers, routes, info windows
- `search/` — place search panel, category/rating filters, area search
- `community/` — travel post board, free board, post detail, comments, voting
- `chat/` — AI wizard chat UI (currently disabled in routes)
- `auth/` — login modal (Google OAuth), profile page
- `contact/` — inquiry form
- `landing/` — landing page with city cards and AI prompt
- `layout/` — Header, ErrorBoundary
- `routing/` — `RequireAuth` guard
- `trips/` — saved trip list page
- `ui/` — shared primitives (Radix UI + CVA based). ESLint relaxes `react-refresh/only-export-components` for this directory.

## Design System

Current product direction is a dark-only redesign with a mysterious, travel-forward, cosmic mood. Favor deep charcoal and blue-black surfaces, restrained aurora accents, crisp typography, and clear hierarchy. The feeling should be modern and atmospheric, not loud or game-like.

- Do not preserve the legacy cyan/violet/neon-pink palette by default.
- Do not add or maintain a light theme unless the user explicitly asks for it.
- Avoid heavy glassmorphism, oversized glow effects, and excessive gradients.
- Prioritize usability over decoration: larger touch targets, stronger section hierarchy, clearer actions, and denser browse layouts where scanability matters.
- Mobile web support must be first-class, not a desktop layout squeezed into a narrow viewport.

## Full Redesign Rules

- When the user says to "change the UI completely", do not keep the old page structure and merely restyle components.
- References from the user should influence layout, interaction patterns, information density, and flow first. Do not copy their color palette unless requested.
- Rework the global shell, landing page, planner, community, and board layouts as needed to fit the actual product features.
- Existing tabs, headers, card sizes, and split-pane assumptions can be replaced if they hurt usability.
- The free board should be more compact and easier to scan than the current oversized-card layout.
- The planner should optimize around map search, itinerary editing, route visibility, and collaboration instead of preserving the current panel arrangement.
- For major redesign work, use `../docs/ui-redesign-brief.md` as the baseline brief and update it if the product direction changes.

## Key Patterns

- Supabase connection has fallback/mock logic (`lib/supabase.ts` exports `isSupabaseConfigured`) so the app doesn't crash without Supabase env vars.
- Place IDs from Google are prefixed with `google-` (e.g., `google-ChIJ...`). The `place-details` API strips this prefix before calling Google.
- Share links use URL-safe Base64 encoding (`lib/shareUtils.ts`). PDF export via `@react-pdf/renderer` (`lib/exportPdf.tsx`).
- Image uploads go to Supabase Storage `images` bucket (`lib/uploadImage.ts`).
- Rich text (free board) uses Tiptap editor, rendered with DOMPurify sanitization.
- `lib/travelTimes.ts` provides straight-line estimates; hooks can optionally enhance with Google Directions API.

## Types (`types/`)

Domain types split by concern: `place.ts`, `schedule.ts`, `wizard.ts`, `community.ts`, `map.ts`. Reuse these instead of creating inline types.
