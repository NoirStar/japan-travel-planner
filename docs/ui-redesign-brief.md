# UI Redesign Brief

This brief exists to stop "theme refresh only" work. The goal is a product-wide UX overhaul that keeps the features but replaces the current UI structure.

## Core Intent

- Redesign the product from the ground up while preserving core functionality.
- Change layout, navigation, component hierarchy, interaction flow, density, and responsive behavior.
- Borrow structure and UX patterns from user-provided references, but not their orange palette.
- Default to dark mode only.
- Make the product feel like a polished, professional travel service, not a hobby project or a theme experiment.
- Prioritize usability over decoration. If the UI looks better but is harder to use, the redesign has failed.

## Reference Validation

- The agent must explicitly review the user-provided reference images before redesigning.
- Before implementing, the agent should explain which layout, hierarchy, spacing, card composition, navigation, or interaction ideas were taken from the references.
- The agent should not merely claim to have used the references; it should name concrete patterns it is applying.
- If the references were not actually available or could not be inspected, the agent must say so before proceeding.

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

## Functional Preservation

The redesign must keep the existing product capability intact.

- Do not drop features in order to make the UI cleaner.
- Do not hide important actions behind unclear affordances.
- Before editing, identify the current user-facing features on each major route.
- After editing, verify that travel planning, sharing, collaboration, chat, community browsing, copying trips, and post flows still work in the redesigned structure.

## Visual Direction

- Mood: mysterious, cosmic, refined, travel-oriented
- Tone: clean, premium, calm, modern, service-grade
- Backgrounds: dark, atmospheric, subtle texture or depth
- Accent usage: restrained and purposeful
- Gradients: limited and soft, never the main design gimmick
- Typography: expressive but readable, with strong hierarchy
- The product should feel like a premium travel platform or mature digital service, not a flashy concept shot.

Avoid:

- Simple recolors of the existing UI
- Neon overload
- Random decorative widgets with no functional value
- Crowded controls or tiny tap targets
- A desktop-first layout that breaks on mobile
- Beautiful but confusing interactions
- Over-designed visuals that reduce clarity or trust

## Non-Negotiables

- Do not preserve existing UI just because it already exists.
- Do not solve this by only changing colors, shadows, or border radius.
- Do not keep awkward top tabs, undersized buttons, or oversized post cards if they hurt usability.
- Do not implement a light theme.
- Do not introduce many competing gradients.
- Do not finish the task if major features are missing.
- Do not treat mobile as an afterthought.

## Usability Standards

- Primary actions should be obvious at a glance.
- Users should understand what the page is for and what to do next within a few seconds.
- Information hierarchy should guide the eye naturally.
- Touch targets should be comfortable, especially on mobile.
- Navigation should be predictable and low-friction.
- Frequently used actions should require fewer steps than secondary actions.
- Planner state should always be legible: active day, selected place, route context, collaboration state.
- Boards and community feeds should optimize scanability and comparison, not oversized presentation.
- Loading, empty, error, active, selected, and disabled states should be intentionally designed.
- Readability, contrast, spacing, and alignment should be treated as core UX quality, not cosmetic detail.

## Redesign Targets

### Global Shell

- Replace the current generic header/navigation if needed.
- Build a clearer product hierarchy between planner, shared trips, community, and profile/actions.
- Desktop and mobile should feel intentionally designed, not like the same header scaled down.
- Users should always understand where they are and what major actions are available.

### Landing Page

- Keep it very clean.
- One clear primary CTA to start planning.
- Introduce the product through simple high-value sections, not a busy feature dump.
- Show trust and discovery through real use cases: planning, collaborative editing, community remix.
- Visual tone should feel premium and atmospheric without becoming noisy.
- The first screen should communicate the product value quickly and confidently.

### Planner

The planner is the most important screen and should be redesigned around real trip-building behavior.

Required UX priorities:

- Fast place discovery from map/search
- Easy day switching
- Clear itinerary editing and reordering
- Visible route flow between selected places
- Accessible collaboration and share controls
- Strong mobile usability
- Clear status awareness so users do not get lost while editing
- Fewer friction points between search, add, reorder, and review

Recommended desktop structure:

- A trip control rail for trip overview, day selection, collaborators, and utilities
- A primary itinerary workspace for the selected day's schedule
- A map exploration canvas with search and result layers

Recommended mobile structure:

- Full-screen map or itinerary focus with large thumb-friendly controls
- Sheet-based or dock-based navigation rather than cramped tiny tabs
- Sticky context showing current day and selected place state
- Mobile should feel designed for actual trip planning, not like a squeezed desktop workspace

### Shared Collaboration

- Shared editing should feel like a first-class mode, not an afterthought.
- Collaboration state, invite/share controls, participant presence, and trip chat should be easy to find.
- Chat should support co-planning naturally without overwhelming the planner workspace.
- Collaboration affordances should be visible enough that users understand the trip can be co-edited.

### Travel Community

- Make shared itineraries easier to browse, compare, and remix.
- Highlight quality signals such as rating, popularity, travel stage, city, and duration.
- Support "follow this trip" or "copy this trip" behavior clearly in the card or detail flow.
- The browsing experience should feel efficient and trustworthy.

### Free Board

- The current single-post cards are too large.
- Use a denser list or compact card layout so more posts fit on one screen.
- Prioritize scanability: title, author, date, likes, comments, thumbnail, short excerpt.
- Desktop should allow much faster browsing than the current layout.
- Search, sort, filtering, and reading flow should be easier than before.

## Implementation Standard

When doing a redesign, the agent should:

1. Audit the current routes and major screens first.
2. Identify the current user-facing features that must survive the redesign.
3. Explain what was taken from the user references before editing.
4. Explain the new page structure before editing.
5. Replace old layout assumptions instead of decorating them.
6. Keep business logic and data flow intact when possible.
7. Implement responsive behavior intentionally for desktop and mobile.
8. Re-check feature completeness and usability before considering the redesign done.

## Definition Of Done

The redesign is not complete unless most of the following are true:

- The page structure is recognizably different from the old UI.
- Navigation and screen hierarchy are improved.
- Planner workflow feels rebuilt, not merely restyled.
- Community and free board browsing density are improved.
- Buttons, tabs, filters, and controls have been reconsidered for usability.
- Mobile layouts feel purpose-built.
- The visual language actually changed, not just the layout copy.
- Major product features are still present and usable.
- The result feels like a professional service and not a themed mockup.
- Users can understand key actions quickly without hunting through the interface.

## Prompt Template For Major Redesign Work

Use this style of instruction when requesting implementation:

```text
Do a full UI/UX overhaul of this project. Do not preserve the current layout unless functionality requires it.

This is not a color refresh. You must replace the page structure, navigation patterns, component hierarchy, spacing system, and mobile behavior while keeping the core features working.

Follow docs/ui-redesign-brief.md.

Before implementing, explicitly explain what you took from the user-provided references. If you could not inspect the references, say so before proceeding.

Priorities:
- Dark theme only
- Mysterious, cosmic, travel-oriented mood
- Clean and modern, not noisy
- Professional service feel
- Strong usability
- Minimal unnecessary decoration
- Mobile web must be fully supported
- No feature loss

Critical requirement:
- If the result still looks like the current UI with new colors, it has failed.
- If important functionality is missing, it has failed.
- If mobile usability regresses, it has failed.

Execution order:
1. Audit the current routes and major screens.
2. Identify the existing user-facing features that must remain.
3. Explain the reference-derived structure and interaction patterns you will apply.
4. Propose the new layout structure for landing, planner, community, and free board.
5. Implement the redesign screen by screen.
6. Replace awkward tabs/buttons/cards instead of reskinning them.
7. Verify responsive behavior, feature completeness, and usability.
```
