-- ═══════════════════════════════════════════════════════
-- タビトーク — 공유 여행 채팅 (Trip Chat Messages)
-- 공동 편집 내부 채팅: shared_trips 멤버 전용
-- ═══════════════════════════════════════════════════════

-- ── 여행 채팅 메시지 ──────────────────────────────────
create table if not exists trip_chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references shared_trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_chat_messages_trip_created_idx
  on trip_chat_messages (trip_id, created_at desc);

-- ═══════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════
alter table trip_chat_messages enable row level security;

-- 같은 trip 멤버만 조회 가능
create policy "여행채팅 멤버 조회" on trip_chat_messages for select using (
  exists (
    select 1 from trip_members tm
    where tm.trip_id = trip_chat_messages.trip_id and tm.user_id = auth.uid()
  )
);

-- 멤버(owner/editor)만 메시지 작성 가능
create policy "여행채팅 작성" on trip_chat_messages for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from trip_members tm
    where tm.trip_id = trip_chat_messages.trip_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'editor')
  )
);

-- ═══════════════════════════════════════════════════════
-- Realtime — 채팅 메시지 실시간 구독
-- ═══════════════════════════════════════════════════════
alter publication supabase_realtime add table trip_chat_messages;
