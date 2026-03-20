-- ═══════════════════════════════════════════════════════
-- タビトーク — 개인 여행 클라우드 동기화
-- user_trips: 유저별 개인 여행 데이터 서버 저장
-- ═══════════════════════════════════════════════════════

create table if not exists user_trips (
  user_id uuid primary key references profiles(id) on delete cascade,
  trips_data jsonb not null default '[]',
  active_trip_id text,
  updated_at timestamptz not null default now()
);

-- RLS
alter table user_trips enable row level security;

create policy "본인 여행 조회" on user_trips for select using (auth.uid() = user_id);
create policy "본인 여행 생성" on user_trips for insert with check (auth.uid() = user_id);
create policy "본인 여행 수정" on user_trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "본인 여행 삭제" on user_trips for delete using (auth.uid() = user_id);

-- upsert 함수: 클라이언트에서 저장 시 사용
create or replace function upsert_user_trips(
  p_user_id uuid,
  p_trips_data jsonb,
  p_active_trip_id text
)
returns timestamptz
language plpgsql
security definer
as $$
declare
  _now timestamptz := now();
begin
  insert into user_trips (user_id, trips_data, active_trip_id, updated_at)
  values (p_user_id, p_trips_data, p_active_trip_id, _now)
  on conflict (user_id)
  do update set
    trips_data = excluded.trips_data,
    active_trip_id = excluded.active_trip_id,
    updated_at = _now;
  return _now;
end;
$$;
