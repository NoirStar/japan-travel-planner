-- ═══════════════════════════════════════════════════════
-- タビトーク — 공동 편집 (Collaborative Trips)
-- shared_trips + trip_members
-- ═══════════════════════════════════════════════════════

-- ── 공유 여행 ─────────────────────────────────────────
create table if not exists shared_trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  trip_data jsonb not null default '{}',
  place_data jsonb not null default '{}',
  version int not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists shared_trips_owner_id_idx on shared_trips (owner_id);
create index if not exists shared_trips_invite_code_idx on shared_trips (invite_code);

-- ── 멤버/권한 ─────────────────────────────────────────
create table if not exists trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references shared_trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')) default 'editor',
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index if not exists trip_members_trip_id_idx on trip_members (trip_id);
create index if not exists trip_members_user_id_idx on trip_members (user_id);

-- ═══════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════
alter table shared_trips enable row level security;
alter table trip_members enable row level security;

-- shared_trips: 멤버만 조회, owner+editor만 수정
create policy "공유여행 멤버 조회" on shared_trips for select using (
  exists (select 1 from trip_members tm where tm.trip_id = id and tm.user_id = auth.uid())
);
create policy "공유여행 생성" on shared_trips for insert with check (auth.uid() = owner_id);
create policy "공유여행 수정" on shared_trips for update using (
  exists (
    select 1 from trip_members tm
    where tm.trip_id = id and tm.user_id = auth.uid() and tm.role in ('owner', 'editor')
  )
);
create policy "공유여행 삭제" on shared_trips for delete using (auth.uid() = owner_id);

-- trip_members: 같은 trip 멤버끼리 조회, owner만 관리
create policy "멤버 조회" on trip_members for select using (
  exists (
    select 1 from trip_members tm2
    where tm2.trip_id = trip_id and tm2.user_id = auth.uid()
  )
);
create policy "멤버 추가" on trip_members for insert with check (
  -- owner가 추가하거나, 본인이 invite로 가입하는 경우 (RPC에서 처리)
  auth.uid() = user_id
  or exists (
    select 1 from trip_members tm
    where tm.trip_id = trip_id and tm.user_id = auth.uid() and tm.role = 'owner'
  )
);
create policy "멤버 삭제" on trip_members for delete using (
  -- owner가 삭제하거나, 본인이 탈퇴
  auth.uid() = user_id
  or exists (
    select 1 from shared_trips st
    where st.id = trip_id and st.owner_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════
-- RPC: 초대 코드로 참여
-- ═══════════════════════════════════════════════════════
create or replace function join_trip_by_invite(p_invite_code text)
returns jsonb as $$
declare
  v_trip shared_trips;
  v_existing trip_members;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- 초대 코드로 trip 조회
  select * into v_trip from shared_trips where invite_code = p_invite_code;
  if v_trip.id is null then
    raise exception 'Invalid invite code';
  end if;

  -- 이미 멤버인지 확인
  select * into v_existing from trip_members
    where trip_id = v_trip.id and user_id = auth.uid();

  if v_existing.id is not null then
    -- 이미 참여 중 → trip 정보만 반환
    return jsonb_build_object(
      'trip_id', v_trip.id,
      'trip_data', v_trip.trip_data,
      'place_data', v_trip.place_data,
      'role', v_existing.role,
      'already_member', true
    );
  end if;

  -- 새 멤버로 추가
  insert into trip_members (trip_id, user_id, role)
  values (v_trip.id, auth.uid(), 'editor');

  return jsonb_build_object(
    'trip_id', v_trip.id,
    'trip_data', v_trip.trip_data,
    'place_data', v_trip.place_data,
    'role', 'editor',
    'already_member', false
  );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function join_trip_by_invite(text) to authenticated;

-- ═══════════════════════════════════════════════════════
-- RPC: 원자적 버전 증가 + 데이터 저장
-- ═══════════════════════════════════════════════════════
create or replace function increment_shared_trip_version(
  p_trip_id uuid,
  p_trip_data jsonb,
  p_place_data jsonb
)
returns int as $$
declare
  v_new_version int;
begin
  update shared_trips
  set trip_data = p_trip_data,
      place_data = p_place_data,
      version = version + 1,
      updated_at = now()
  where id = p_trip_id
    and exists (
      select 1 from trip_members tm
      where tm.trip_id = p_trip_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'editor')
    )
  returning version into v_new_version;

  if v_new_version is null then
    raise exception 'Not authorized or trip not found';
  end if;

  return v_new_version;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function increment_shared_trip_version(uuid, jsonb, jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════
-- Realtime — 공유 여행 변경 실시간 구독
-- ═══════════════════════════════════════════════════════
alter publication supabase_realtime add table shared_trips;
