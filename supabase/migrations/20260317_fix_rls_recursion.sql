-- ═══════════════════════════════════════════════════════
-- FIX: infinite recursion in trip_members RLS policy
-- trip_members SELECT policy가 자기 자신을 참조해서 무한재귀 발생
-- SECURITY DEFINER 함수로 RLS 우회하여 해결
-- ═══════════════════════════════════════════════════════

-- ── 멤버십 확인 함수 (SECURITY DEFINER = RLS 우회) ───
create or replace function is_trip_member(p_trip_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from trip_members
    where trip_id = p_trip_id and user_id = p_user_id
  );
end;
$$ language plpgsql security definer stable set search_path = public;

-- owner/editor 확인 함수
create or replace function is_trip_editor(p_trip_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from trip_members
    where trip_id = p_trip_id and user_id = p_user_id and role in ('owner', 'editor')
  );
end;
$$ language plpgsql security definer stable set search_path = public;

-- ═══════════════════════════════════════════════════════
-- trip_members 기존 정책 삭제 → 재생성
-- ═══════════════════════════════════════════════════════
drop policy if exists "멤버 조회" on trip_members;
drop policy if exists "멤버 추가" on trip_members;
drop policy if exists "멤버 삭제" on trip_members;

-- 같은 trip의 멤버끼리 조회 (SECURITY DEFINER 함수 사용 → 재귀 없음)
create policy "멤버 조회" on trip_members for select using (
  is_trip_member(trip_id, auth.uid())
);

-- 멤버 추가: 본인 가입 또는 owner가 추가
create policy "멤버 추가" on trip_members for insert with check (
  auth.uid() = user_id
  or exists (
    select 1 from shared_trips st
    where st.id = trip_id and st.owner_id = auth.uid()
  )
);

-- 멤버 삭제: 본인 탈퇴 또는 owner가 삭제
create policy "멤버 삭제" on trip_members for delete using (
  auth.uid() = user_id
  or exists (
    select 1 from shared_trips st
    where st.id = trip_id and st.owner_id = auth.uid()
  )
);

-- ═══════════════════════════════════════════════════════
-- shared_trips 기존 정책 삭제 → 재생성
-- ═══════════════════════════════════════════════════════
drop policy if exists "공유여행 멤버 조회" on shared_trips;
drop policy if exists "공유여행 생성" on shared_trips;
drop policy if exists "공유여행 수정" on shared_trips;
drop policy if exists "공유여행 삭제" on shared_trips;

-- 소유자 또는 멤버만 조회 (owner_id로 직접 확인 → INSERT + RETURNING 시에도 통과)
create policy "공유여행 멤버 조회" on shared_trips for select using (
  owner_id = auth.uid() or is_trip_member(id, auth.uid())
);

create policy "공유여행 생성" on shared_trips for insert with check (auth.uid() = owner_id);

-- owner+editor만 수정 (SECURITY DEFINER 함수 사용)
create policy "공유여행 수정" on shared_trips for update using (
  is_trip_editor(id, auth.uid())
);

create policy "공유여행 삭제" on shared_trips for delete using (auth.uid() = owner_id);

-- ═══════════════════════════════════════════════════════
-- trip_chat_messages 기존 정책도 SECURITY DEFINER 함수 사용으로 변경
-- ═══════════════════════════════════════════════════════
drop policy if exists "여행채팅 멤버 조회" on trip_chat_messages;
drop policy if exists "여행채팅 작성" on trip_chat_messages;

create policy "여행채팅 멤버 조회" on trip_chat_messages for select using (
  is_trip_member(trip_id, auth.uid())
);

create policy "여행채팅 작성" on trip_chat_messages for insert with check (
  auth.uid() = user_id
  and is_trip_editor(trip_id, auth.uid())
);

-- ═══════════════════════════════════════════════════════
-- RPC: 원자적 공유 여행 생성 (INSERT 시 RLS 충돌 방지)
-- shared_trip + owner trip_member를 하나의 트랜잭션으로 생성
-- ═══════════════════════════════════════════════════════
create or replace function create_shared_trip(
  p_trip_data jsonb,
  p_place_data jsonb
)
returns jsonb as $$
declare
  v_trip_id uuid;
  v_invite_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- 공유 여행 생성
  insert into shared_trips (owner_id, trip_data, place_data)
  values (auth.uid(), p_trip_data, p_place_data)
  returning id, invite_code into v_trip_id, v_invite_code;

  -- 소유자를 멤버로 즉시 추가
  insert into trip_members (trip_id, user_id, role)
  values (v_trip_id, auth.uid(), 'owner');

  return jsonb_build_object(
    'id', v_trip_id,
    'invite_code', v_invite_code
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ═══════════════════════════════════════════════════════
-- 함수 실행 권한 부여
-- ═══════════════════════════════════════════════════════
grant execute on function is_trip_member(uuid, uuid) to authenticated;
grant execute on function is_trip_editor(uuid, uuid) to authenticated;
grant execute on function create_shared_trip(jsonb, jsonb) to authenticated;
