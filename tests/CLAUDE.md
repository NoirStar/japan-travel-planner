# tests/CLAUDE.md — Testing

## Stack

Vitest + jsdom + React Testing Library. Setup file: `tests/setup.ts` (imports `@testing-library/jest-dom` matchers).

## Running Tests

```bash
npm test                                          # All tests, single run
npm run test:watch                                # Watch mode
npx vitest run tests/stores/scheduleStore.test.ts # Single file
npx vitest run -t "test name pattern"             # By test name
```

## Configuration

`vitest.config.ts` (project root):
- `globals: true` — no need to import `describe`, `it`, `expect`
- `environment: "jsdom"` — browser-like DOM
- `css: true` — processes CSS imports
- Supabase env vars are stubbed to dummy values for test isolation (`https://test.supabase.co`, `test-anon-key`)
- Path alias `@/` → `src/` matches the app config

## Structure

Tests mirror `src/` layout:
```
tests/
  components/   # React component tests (render, interaction)
  stores/       # Zustand store logic tests
  services/     # Service function tests
  hooks/        # Custom hook tests
  data/         # Data utility tests
  setup.ts      # Global test setup
```

## Conventions

- Test files named `*.test.ts` or `*.test.tsx`
- Mock external dependencies (Supabase, Google APIs) — tests should not make real API calls
- Use `@testing-library/react` for component tests: `render`, `screen`, `fireEvent`, `waitFor`
- Zustand stores can be tested directly by calling store actions and asserting state
