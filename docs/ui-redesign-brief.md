# UI Redesign Brief

This brief exists to stop "theme refresh only" work. The goal is a product-wide UX overhaul that keeps the features but replaces the current UI structure.

## Core Intent

- Redesign the product from the ground up while preserving core functionality.
- Change layout, navigation, component hierarchy, interaction flow, density, and responsive behavior.
- Borrow structure and UX patterns from user-provided references, but not their orange palette.
- Default to dark mode only.

## Product Understanding

The product has three primary jobs:

1. Travel planning
2. Shared trip collaboration
3. Community discovery and remix

Key user actions:

- Search places through Google Maps
- Add places into a day plan
- See markers and route lines on the map
- Share a trip and co-edit it
- Chat while collaborating on a shared trip
- Browse highly rated or popular trip plans
- Copy another user's trip and reuse it
- Read and write community posts and reviews

## Visual Direction

- Mood: mysterious, cosmic, refined, travel-oriented
- Tone: clean, premium, calm, modern
- Backgrounds: dark, atmospheric, subtle texture or depth
- Accent usage: restrained and purposeful
- Gradients: limited and soft, never the main design gimmick
- Typography: expressive but readable, with strong hierarchy

Avoid:

- Simple recolors of the existing UI
- Neon overload
- Random decorative widgets with no functional value
- Crowded controls or tiny tap targets
- A desktop-first layout that breaks on mobile

## Non-Negotiables

- Do not preserve existing UI just because it already exists.
- Do not solve this by only changing colors, shadows, or border radius.
- Do not keep awkward top tabs, undersized buttons, or oversized post cards if they hurt usability.
- Do not implement a light theme.
- Do not introduce many competing gradients.

## Redesign Targets

### Global Shell

- Replace the current generic header/navigation if needed.
- Build a clearer product hierarchy between planner, shared trips, community, and profile/actions.
- Desktop and mobile should feel intentionally designed, not like the same header scaled down.

### Landing Page

- Keep it very clean.
- One clear primary CTA to start planning.
- Introduce the product through simple high-value sections, not a busy feature dump.
- Show trust and discovery through real use cases: planning, collaborative editing, community remix.
- Visual tone should feel premium and atmospheric without becoming noisy.

### Planner

The planner is the most important screen and should be redesigned around real trip-building behavior.

Required UX priorities:

- Fast place discovery from map/search
- Easy day switching
- Clear itinerary editing and reordering
- Visible route flow between selected places
- Accessible collaboration and share controls
- Strong mobile usability

Recommended desktop structure:

- A trip control rail for trip overview, day selection, collaborators, and utilities
- A primary itinerary workspace for the selected day's schedule
- A map exploration canvas with search and result layers

Recommended mobile structure:

- Full-screen map or itinerary focus with large thumb-friendly controls
- Sheet-based or dock-based navigation rather than cramped tiny tabs
- Sticky context showing current day and selected place state

### Shared Collaboration

- Shared editing should feel like a first-class mode, not an afterthought.
- Collaboration state, invite/share controls, participant presence, and trip chat should be easy to find.
- Chat should support co-planning naturally without overwhelming the planner workspace.

### Travel Community

- Make shared itineraries easier to browse, compare, and remix.
- Highlight quality signals such as rating, popularity, travel stage, city, and duration.
- Support "follow this trip" or "copy this trip" behavior clearly in the card or detail flow.

### Free Board

- The current single-post cards are too large.
- Use a denser list or compact card layout so more posts fit on one screen.
- Prioritize scanability: title, author, date, likes, comments, thumbnail, short excerpt.
- Desktop should allow much faster browsing than the current layout.

## Implementation Standard

When doing a redesign, the agent should:

1. Audit the current routes and major screens first.
2. Explain the new page structure before editing.
3. Replace old layout assumptions instead of decorating them.
4. Keep business logic and data flow intact when possible.
5. Implement responsive behavior intentionally for desktop and mobile.

## Definition Of Done

The redesign is not complete unless most of the following are true:

- The page structure is recognizably different from the old UI.
- Navigation and screen hierarchy are improved.
- Planner workflow feels rebuilt, not merely restyled.
- Community and free board browsing density are improved.
- Buttons, tabs, filters, and controls have been reconsidered for usability.
- Mobile layouts feel purpose-built.

## Prompt Template For Major Redesign Work

Use this style of instruction when requesting implementation:

```text
Do a full UI/UX overhaul of this project. Do not preserve the current layout unless functionality requires it.

This is not a color refresh. You must replace the page structure, navigation patterns, component hierarchy, spacing system, and mobile behavior while keeping the core features working.

Follow docs/ui-redesign-brief.md.

Priorities:
- Dark theme only
- Mysterious, cosmic, travel-oriented mood
- Clean and modern, not noisy
- Strong usability
- Minimal unnecessary decoration
- Mobile web must be fully supported

Critical requirement:
- If the result still looks like the current UI with new colors, it has failed.

Execution order:
1. Audit the current routes and major screens.
2. Propose the new layout structure for landing, planner, community, and free board.
3. Implement the redesign screen by screen.
4. Replace awkward tabs/buttons/cards instead of reskinning them.
5. Verify responsive behavior.
```
