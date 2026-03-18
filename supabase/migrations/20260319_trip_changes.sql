-- 여행 변경 이력 테이블
create table if not exists trip_changes (
  id         bigint generated always as identity primary key,
  trip_id    uuid not null references shared_trips(id) on delete cascade,
  user_id    uuid references profiles(id) on delete set null,
  version    int not null,
  summary    text not null default '',
  created_at timestamptz not null default now()
);

create index idx_trip_changes_trip on trip_changes(trip_id, created_at desc);

-- RLS
alter table trip_changes enable row level security;

create policy "trip_changes_select" on trip_changes
  for select using (
    exists (
      select 1 from trip_members tm
      where tm.trip_id = trip_changes.trip_id
        and tm.user_id = auth.uid()
    )
  );

-- 기존 increment_shared_trip_version RPC를 확장하여 변경 이력 기록
-- 별도 RPC로 변경 이력 기록 (클라이언트에서 호출)
create or replace function log_trip_change(
  p_trip_id uuid,
  p_summary text
) returns void
language plpgsql security definer
as $$
declare
  v_version int;
begin
  select version into v_version from shared_trips where id = p_trip_id;
  if v_version is null then return; end if;

  insert into trip_changes (trip_id, user_id, version, summary)
  values (p_trip_id, auth.uid(), v_version, p_summary);

  -- 오래된 이력 정리 (최근 200건만 유지)
  delete from trip_changes
  where trip_id = p_trip_id
    and id not in (
      select id from trip_changes
      where trip_id = p_trip_id
      order by created_at desc
      limit 200
    );
end;
$$;

-- 변경 이력 조회 RPC
create or replace function get_trip_changes(
  p_trip_id uuid,
  p_limit int default 50
) returns table (
  id bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  version int,
  summary text,
  created_at timestamptz
)
language sql security definer stable
as $$
  select
    tc.id,
    tc.user_id,
    coalesce(p.display_name, '알 수 없는 사용자') as display_name,
    p.avatar_url,
    tc.version,
    tc.summary,
    tc.created_at
  from trip_changes tc
  left join profiles p on p.id = tc.user_id
  where tc.trip_id = p_trip_id
    and exists (
      select 1 from trip_members tm
      where tm.trip_id = p_trip_id
        and tm.user_id = auth.uid()
    )
  order by tc.created_at desc
  limit p_limit;
$$;
