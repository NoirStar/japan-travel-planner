-- ═══════════════════════════════════════════════════════
-- タビトーク — 일정 공유 (Short URL Shares)
-- 짧은 코드 기반 공유 링크 시스템
-- ═══════════════════════════════════════════════════════

-- ── 공유 스냅샷 테이블 ────────────────────────────────
create table if not exists trip_shares (
  id uuid primary key default gen_random_uuid(),
  share_code text not null unique default encode(gen_random_bytes(12), 'hex'),
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

-- 본인 공유 링크만 조회 (공개 조회는 security definer RPC 경유)
create policy "본인 공유 링크 조회" on trip_shares for select using (auth.uid() = user_id);
-- INSERT는 security definer RPC만 허용 (직접 삽입 차단)
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
  v_retries int := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- 페이로드 기본 검증
  if jsonb_typeof(p_trip_data) != 'object' then
    raise exception 'trip_data must be a JSON object';
  end if;
  if p_trip_data->>'t' is null or p_trip_data->>'c' is null then
    raise exception 'trip_data must contain t (title) and c (cityId)';
  end if;
  if octet_length(p_trip_data::text) > 512000 then
    raise exception 'trip_data exceeds 500KB limit';
  end if;
  if jsonb_typeof(p_place_data) != 'object' then
    raise exception 'place_data must be a JSON object';
  end if;

  -- 충돌 방지 재시도 루프
  loop
    begin
      insert into trip_shares (user_id, trip_data, place_data)
      values (auth.uid(), p_trip_data, p_place_data)
      returning share_code into v_code;
      return v_code;
    exception when unique_violation then
      v_retries := v_retries + 1;
      if v_retries > 3 then
        raise exception 'Failed to generate unique share code';
      end if;
    end;
  end loop;
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
