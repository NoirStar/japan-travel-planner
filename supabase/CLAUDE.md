# supabase/CLAUDE.md — Database

## Overview

Supabase provides Auth, Database (Postgres), Realtime, and Storage. Auth is Google OAuth only. The app functions in limited mode without Supabase (planner works but no persistence, login, or community).

## Schema (`schema.sql`)

Core tables:
- `profiles` — extends `auth.users`. Auto-created via `handle_new_user()` trigger. Includes nickname (unique, case-insensitive), avatar, points/level system (20 levels), admin flag.
- `posts` — community posts. `board_type` distinguishes `'travel'` (with `trip_data` JSONB) from `'free'` (with `content` rich text). Has `likes_count`, `dislikes_count`, `comments_count` denormalized counters.
- `post_votes` / `comment_votes` — one vote per user per item, `vote_type` is `'up'` or `'down'`.
- `comments` — per-post, with own like/dislike counters.
- `notifications` — capped at 100 per user (auto-pruned by `create_notification` RPC). Types: `'comment'`, `'like'`.
- `inquiries` — user support tickets with admin reply. Categories: `'bug'`, `'feature'`, `'question'`, `'other'`.

## RLS Policies

All tables have RLS enabled. General pattern:
- Public read (posts, comments, profiles, votes)
- Authenticated write (own rows only)
- Admin override for delete/update on posts, comments, inquiries
- Notifications and inquiries: visible only to owner + admin

## RPC Functions

Vote operations use atomic RPC to avoid race conditions:
- `toggle_post_vote(post_id, vote_type)` — toggles vote + updates counters atomically, returns new counts
- `toggle_comment_vote(comment_id, vote_type)` — same for comments
- `increment_count` / `decrement_count` — post counter manipulation
- `increment_comment_count` / `decrement_comment_count` — comment counter manipulation
- `create_notification(target_user_id, type, post_id, title, actor)` — creates notification, auto-prunes old ones
- `sync_my_level()` — recalculates user level from points

All RPC functions run as `security definer` with explicit `GRANT EXECUTE` to `authenticated` role.

## Migrations (`migrations/`)

Applied in chronological order after `schema.sql`. Cover: notification/vote fixes, inquiries, storage bucket policies, shared trips, collaborative chat, RLS recursion fixes, trip attachments/changes, user trips, features/metadata.

## Realtime

`notifications` table is added to `supabase_realtime` publication for live notification feed. Trip chat also uses Realtime channels.

## Storage

`images` bucket for user-uploaded images (community posts, profile). Bucket policies configured in migrations.
