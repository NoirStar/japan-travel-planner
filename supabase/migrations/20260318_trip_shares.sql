-- ═══════════════════════════════════════════════════════
-- タビトーク — 일정 공유 (Short URL Shares)
-- 짧은 코드 기반 공유 링크 시스템
-- ═══════════════════════════════════════════════════════

-- ── 공유 스냅샷 테이블 ────────────────────────────────
create table if not exists trip_shares (
  id uuid primary key default gen_random_uuid(),
  share_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  user_id uuid references profiles(id) on delete set null,
  trip_data jsonb not null,
  place_data jsonb not null default '{}',
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '90 days')
);

create index if not exists trip_shares_share_code_idx on trip_shares (share_code);
create index if not exists trip_shares_user_id_idx on trip_shares (user_id);

-- RLS
alter table trip_shares enable row level security;

-- 누구나 share_code로 조회 가능
create policy "공유 링크 조회" on trip_shares for select using (true);
-- 로그인한 사용자만 생성
create policy "공유 링크 생성" on trip_shares for insert with check (auth.uid() = user_id);
-- 본인만 삭제
create policy "공유 링크 삭제" on trip_shares for delete using (auth.uid() = user_id);

-- ── RPC: 공유 링크 생성 ──────────────────────────────
create or replace function create_trip_share(
  p_trip_data jsonb,
  p_place_data jsonb default '{}'
)
returns text as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into trip_shares (user_id, trip_data, place_data)
  values (auth.uid(), p_trip_data, p_place_data)
  returning share_code into v_code;

  return v_code;
end;
$$ language plpgsql security definer set search_path = public;

-- ── RPC: 공유 링크 조회 + 조회수 증가 ────────────────
create or replace function get_trip_share(p_share_code text)
returns jsonb as $$
declare
  v_result jsonb;
begin
  update trip_shares
  set view_count = view_count + 1
  where share_code = p_share_code
    and (expires_at is null or expires_at > now());

  select jsonb_build_object(
    'trip_data', ts.trip_data,
    'place_data', ts.place_data,
    'view_count', ts.view_count,
    'created_at', ts.created_at
  ) into v_result
  from trip_shares ts
  where ts.share_code = p_share_code
    and (ts.expires_at is null or ts.expires_at > now());

  if v_result is null then
    raise exception 'Share not found or expired';
  end if;

  return v_result;
end;
$$ language plpgsql security definer set search_path = public;

-- GRANT
grant execute on function create_trip_share(jsonb, jsonb) to authenticated;
grant execute on function get_trip_share(text) to anon, authenticated;
