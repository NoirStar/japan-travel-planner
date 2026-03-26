# src/CLAUDE.md — Frontend Guide

## Tech Stack

- **React 19** + **React Router v7** (lazy code-splitting via `lazyRetry`)
- **Zustand 5** for state management (persist middleware for scheduleStore)
- **Tailwind CSS 4** with custom theme variables in `index.css`
- **Radix UI** + **CVA** for headless primitives and variant-based components
- **@vis.gl/react-google-maps** for map rendering
- **@dnd-kit** for drag-drop itinerary reordering
- **@tiptap/react** for rich text editing (community posts)
- **@react-pdf/renderer** for PDF export
- **Framer Motion** for animations
- **Supabase** for auth, database, storage

## Directory Structure

```
src/
├── components/         # Feature-first component folders
│   ├── auth/           # Login modal, profile page
│   ├── chat/           # AI chat wizard (disabled)
│   ├── community/      # Posts, comments, free board
│   ├── contact/        # Contact page
│   ├── landing/        # Landing page
│   ├── layout/         # AppShell, TopHeader, DesktopRail, MobileDock
│   ├── map/            # MapView, markers, polylines, search
│   ├── planner/        # Core planner: schedule, places, reservations, panels
│   ├── routing/        # RequireAuth guard
│   ├── trips/          # Trip list page
│   └── ui/             # Design system: button, card, dialog, input (CVA-based)
├── stores/             # Zustand stores
├── hooks/              # Custom hooks (business logic extraction)
├── services/           # API clients & business logic
├── lib/                # Utilities (export, share, upload, notifications)
├── types/              # TypeScript type definitions
├── data/               # Static config (cities, places, transport passes)
├── App.tsx             # Router & lazy routes
├── main.tsx            # Entry point
└── index.css           # Tailwind + theme variables + custom utilities
```

## Routing (App.tsx)

| Path | Component | Auth |
|------|-----------|------|
| `/` | LandingPage | No |
| `/planner` | PlannerPage | No |
| `/trips` | TripListPage | Yes |
| `/share/:shareId` | ShareRedirectPage | No |
| `/community` | CommunityPage | No |
| `/community/free` | FreeBoardPage | No |
| `/community/free/write` | CreateFreePostPage | Yes |
| `/profile` | ProfilePage | Yes |
| `/contact` | ContactPage | Yes |
| `/join/:inviteCode` | JoinTripPage | Yes |

Protected routes use `RequireAuth` wrapper. All routes use `lazyRetry` for chunk error recovery.

## State Management (stores/)

| Store | Responsibility | Persisted |
|-------|---------------|-----------|
| `scheduleStore` | Trips, days, places, reservations, active trip | Yes (localStorage per user) |
| `authStore` | User session, profile, login modal, demo mode | No |
| `uiStore` | Panel visibility, modal states, selected place | No |
| `dynamicPlaceStore` | In-memory place cache from search results | No |
| `checklistStore` | Pre-trip checklist items | No |
| `wishlistStore` | Saved places wishlist | No |
| `wizardStore` | AI wizard conversation state | No |

`scheduleStore` is the most critical store — it holds all trip data and syncs to Supabase via `tripSyncService`.

## Hooks (hooks/)

| Hook | Purpose |
|------|---------|
| `useCollaborativeSync` | Real-time Supabase sync for shared trips |
| `useMapSearch` | Google Places search & filtering |
| `useNotifications` | Toast notification system |
| `useScheduleRisks` | Detects scheduling conflicts (time overlap, missing transport) |
| `useSessionState` | Session lifecycle management |
| `useTravelTimes` | Route travel time estimation (lookup + Haversine) |
| `useUserTripSync` | Sync user-trip relationships with backend |

## Services (services/)

| Service | Purpose |
|---------|---------|
| `placesService` | Google Places API client (via `/api` proxy) |
| `tripSyncService` | Supabase CRUD for trips |
| `userTripSync` | User-trip association sync |
| `tripChatService` | Collaborative trip chat |
| `aiRecommendService` | AI-powered place recommendations |
| `tripBuilder` | Trip creation orchestration |
| `wizardEngine` | AI wizard step orchestration |

## Design System

**Dark-only theme** defined via `@theme` in `index.css`:
- Primary: Cosmic Teal (`#2DD4A8`)
- Background: `#0C0F0F` / Card: `#141A1A` / Border: `#243030`
- Font: Pretendard Variable (Korean-optimized)
- Glassmorphism (`.glass`), gradient text, cosmic glow effects

**UI components** (`components/ui/`) use CVA for variants:
- `button.tsx` — variant (default/outline/ghost/destructive), size (sm/md/lg/icon)
- `card.tsx` — Glass card wrapper
- `dialog.tsx` — Radix-based modal
- `input.tsx` — Styled input field

**Custom CSS utilities**: `.glass`, `.gradient-text`, `.glow-cosmic`, `.card-elevated`, `.surface-*`

## Key Patterns

- **Feature-first components**: Group by domain (planner, community, map), not by type.
- **Smart vs presentational**: Feature folders hold stateful components; `ui/` holds pure presentational ones.
- **Business logic out of components**: Extract to hooks, services, or stores. Components handle rendering + event wiring.
- **Google Maps proxy**: All Places API calls go through `/api/places-nearby` (proxied to `:3001` in dev, Vercel serverless in prod).
- **Drag-drop**: `@dnd-kit` with `SortablePlaceCard` / `SortableReservationCard` for itinerary reordering.
- **PDF/ICS export**: `lib/exportPdf.tsx` and `lib/exportIcs.ts` generate downloadable files client-side.
- **Share encoding**: `lib/shareUtils.ts` encodes/decodes trip data for shareable URLs.

## Types (types/)

| File | Key Types |
|------|-----------|
| `place.ts` | `Place`, `PlaceCategory` (enum: restaurant, attraction, accommodation, cafe, transport...) |
| `schedule.ts` | `Trip`, `DaySchedule`, `ScheduleItem`, `Reservation` (flight/train/bus/accommodation) |
| `community.ts` | `Post`, `Comment`, `UserProfile` |
| `map.ts` | Map center, bounds |
| `wizard.ts` | Wizard step types |

Always reuse types from `src/types/` — do not redeclare inline.

## Static Data (data/)

- `cities.ts` — Japanese city configs (name, coordinates, description)
- `mapConfig.ts` — Per-city Google Maps settings (center, zoom, bounds)
- `places/index.ts` — Pre-loaded place database for offline/demo mode
- `transportPasses.ts` — IC Card, Suica, regional pass data
