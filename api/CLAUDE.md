# api/CLAUDE.md — Serverless API

## Overview

Vercel Serverless Functions (Node.js). Each file exports a default `handler(req: VercelRequest, res: VercelResponse)`. All endpoints are POST-only with CORS headers.

## Endpoints

| File | Endpoint | Google API Tier | Purpose |
|------|----------|----------------|---------|
| `places-nearby.ts` | `POST /api/places-nearby` | Essentials | Nearby search by location + category |
| `places-search.ts` | `POST /api/places-search` | Pro (includes rating) | Text search with city bias |
| `place-details.ts` | `POST /api/place-details` | Pro | Single place details (rating, hours, photo) |
| `place-photo.ts` | `POST /api/place-photo` | — | Photo URL proxy |
| `ai-recommend.ts` | `POST /api/ai-recommend` | — | OpenAI GPT-4o-mini itinerary generation |

## Google Places API (New v1)

All Places calls use the **new** Google Places API (`places.googleapis.com/v1/`), not the legacy Maps JavaScript Places library. Key conventions:

- API key via `process.env.GOOGLE_PLACES_API_KEY` (falls back to `VITE_GOOGLE_MAPS_API_KEY`)
- Field selection via `X-Goog-FieldMask` header — keep minimal to stay within tier quotas
- **Never request `reviews` field** — it bumps the call to Enterprise tier (monthly limit drops from 5,000 to 1,000)
- Category mapping: `mapGoogleType()` function classifies Google types → app categories (`attraction`, `restaurant`, `cafe`, `shopping`, `accommodation`, `transport`). Cafe/bakery must be checked before restaurant to avoid misclassification.
- City center coordinates are hardcoded for 4 cities: tokyo, osaka, kyoto, fukuoka

## AI Recommend

Uses OpenAI API (`gpt-4o-mini`) with a system prompt containing available places. Returns structured JSON with `cityId`, `title`, `days[].items[]`, `summary`. The handler validates returned `placeId`s against the input pool.

## Local Dev Server

`api-dev-server.mjs` (project root) — plain Node.js HTTP server on port 3001 replicating the same 3 Places endpoints. Does **not** support `ai-recommend`. Vite proxies `/api` to this server in dev mode.

Run: `node api-dev-server.mjs` (reads `.env.local`)
