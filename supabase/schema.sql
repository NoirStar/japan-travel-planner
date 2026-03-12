-- ═══════════════════════════════════════════════════════
-- タビトーク (TabiTalk) — Supabase Schema v2
-- Auth + 프로필 + 커뮤니티 + 댓글투표 + 채팅
-- ═══════════════════════════════════════════════════════

-- ── 프로필 테이블 ─────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  total_likes int not null default 0,
  total_points int not null default 0,
  level int not null default 1,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 닉네임 유니크 인덱스
create unique index if not exists profiles_nickname_idx on profiles (lower(nickname));

-- ── 커뮤니티 게시글 ───────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  board_type text not null default 'travel',
  title text not null,
  description text,
  content text,
  city_id text not null default '',
  cover_image text,
  trip_data jsonb,                   -- 여행 일정 (travel만), 자유게시판은 null
  likes_count int not null default 0,
  dislikes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_board_type_idx on posts (board_type);
create index if not exists posts_city_id_idx on posts (city_id);
create index if not exists posts_user_id_idx on posts (user_id);
create index if not exists posts_created_at_idx on posts (created_at desc);
create index if not exists posts_likes_count_idx on posts (likes_count desc);

-- ── 게시글 추천/비추천 투표 ───────────────────────────
create table if not exists post_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)  -- 한 사람당 한 표
);

create index if not exists post_votes_post_id_idx on post_votes (post_id);

-- ── 댓글 ──────────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  likes_count int not null default 0,
  dislikes_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on comments (post_id, created_at);

-- ── 댓글 추천/비추천 투표 ────────────────────────────
create table if not exists comment_votes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists comment_votes_comment_id_idx on comment_votes (comment_id);

-- ── 알림 ──────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('comment', 'like')),
  post_id uuid not null references posts(id) on delete cascade,
  post_title text not null,
  actor_nickname text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications (user_id, created_at desc);

-- ── 실시간 채팅 ───────────────────────────────────────
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx on chat_messages (created_at desc);

-- ── 문의 ──────────────────────────────────────────────
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null check (category in ('bug', 'feature', 'question', 'other')),
  title text not null,
  content text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'closed')),
  admin_reply text,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_user_id_idx on inquiries (user_id, created_at desc);
create index if not exists inquiries_status_idx on inquiries (status, created_at desc);

-- ═══════════════════════════════════════════════════════
-- RLS 정책
-- ═══════════════════════════════════════════════════════
alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_votes enable row level security;
alter table comments enable row level security;
alter table comment_votes enable row level security;
alter table notifications enable row level security;
alter table chat_messages enable row level security;
alter table inquiries enable row level security;

-- profiles: 누구나 조회, 본인만 수정
create policy "프로필 공개 조회" on profiles for select using (true);
create policy "본인 프로필 수정" on profiles for update using (auth.uid() = id);
create policy "프로필 생성" on profiles for insert with check (auth.uid() = id);

-- posts: 누구나 조회, 로그인한 사용자만 작성, 본인 또는 관리자만 삭제
create policy "게시글 공개 조회" on posts for select using (true);
create policy "게시글 작성" on posts for insert with check (auth.uid() = user_id);
create policy "게시글 수정" on posts for update using (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
) with check (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "게시글 삭제" on posts for delete using (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- post_votes: 누구나 조회, 로그인한 사용자만 투표
create policy "투표 조회" on post_votes for select using (true);
create policy "투표 등록" on post_votes for insert with check (auth.uid() = user_id);
create policy "투표 삭제" on post_votes for delete using (auth.uid() = user_id);

-- comments: 누구나 조회, 로그인한 사용자만 작성, 본인 또는 관리자만 삭제
create policy "댓글 조회" on comments for select using (true);
create policy "댓글 작성" on comments for insert with check (auth.uid() = user_id);
create policy "댓글 삭제" on comments for delete using (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- comment_votes: 누구나 조회, 로그인한 사용자만 투표
create policy "댓글투표 조회" on comment_votes for select using (true);
create policy "댓글투표 등록" on comment_votes for insert with check (auth.uid() = user_id);
create policy "댓글투표 삭제" on comment_votes for delete using (auth.uid() = user_id);

-- notifications: 본인만 조회/읽음 처리
create policy "알림 조회" on notifications for select using (auth.uid() = user_id);
create policy "알림 읽음 처리" on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat_messages: 누구나 조회, 로그인한 사용자만 작성
create policy "채팅 조회" on chat_messages for select using (true);
create policy "채팅 작성" on chat_messages for insert with check (auth.uid() = user_id);

-- inquiries: 본인 + 관리자만 조회, 로그인한 사용자만 작성, 관리자만 답변(update)
create policy "문의 조회" on inquiries for select using (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "문의 작성" on inquiries for insert with check (auth.uid() = user_id);
create policy "문의 답변" on inquiries for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "문의 삭제" on inquiries for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ═══════════════════════════════════════════════════════
-- 함수 & 트리거
-- ═══════════════════════════════════════════════════════

-- ── 신규 유저 자동 프로필 생성 ────────────────────────
create or replace function handle_new_user()
returns trigger as $$
declare
  _is_admin boolean := false;
begin
  -- sky92332 구글 계정 자동 관리자 승격
  if new.email = 'sky92332@gmail.com' then
    _is_admin := true;
  end if;

  insert into public.profiles (id, nickname, avatar_url, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'タビ' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url',
    _is_admin
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 포인트 기반 레벨 계산 (20레벨) ───────────────────
create or replace function calculate_level(pts int)
returns int as $$
begin
  return case
    when pts >= 2100 then 20
    when pts >= 1850 then 19
    when pts >= 1600 then 18
    when pts >= 1380 then 17
    when pts >= 1180 then 16
    when pts >= 1000 then 15
    when pts >= 840  then 14
    when pts >= 700  then 13
    when pts >= 580  then 12
    when pts >= 470  then 11
    when pts >= 380  then 10
    when pts >= 300  then 9
    when pts >= 230  then 8
    when pts >= 170  then 7
    when pts >= 120  then 6
    when pts >= 80   then 5
    when pts >= 50   then 4
    when pts >= 25   then 3
    when pts >= 10   then 2
    else 1
  end;
end;
$$ language plpgsql immutable;

-- ── 게시글 좋아요 변경 → 작성자 포인트/레벨 재계산 ───
create or replace function update_user_level()
returns trigger as $$
declare
  total_likes_val int;
  pts int;
  current_pts int;
  final_pts int;
  new_level int;
begin
  select coalesce(sum(p.likes_count), 0) into total_likes_val
  from posts p where p.user_id = coalesce(new.user_id, old.user_id);

  -- 포인트 = 좋아요 × 10
  pts := total_likes_val * 10;

  -- 기존 total_points와 비교하여 큰 값 사용 (외부 포인트 보존)
  select total_points into current_pts
  from profiles where id = coalesce(new.user_id, old.user_id);

  final_pts := greatest(coalesce(current_pts, 0), pts);
  new_level := calculate_level(final_pts);

  update profiles
  set total_likes = total_likes_val,
      total_points = final_pts,
      level = new_level
  where id = coalesce(new.user_id, old.user_id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_post_likes_change
  after update of likes_count on posts
  for each row execute function update_user_level();

-- ── RPC: 게시글 카운터 증감 ──────────────────────────
create or replace function increment_count(row_id uuid, col_name text)
returns void as $$
begin
  if col_name = 'likes_count' then
    update posts set likes_count = likes_count + 1 where id = row_id;
  elsif col_name = 'dislikes_count' then
    update posts set dislikes_count = dislikes_count + 1 where id = row_id;
  elsif col_name = 'comments_count' then
    update posts set comments_count = comments_count + 1 where id = row_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function decrement_count(row_id uuid, col_name text)
returns void as $$
begin
  if col_name = 'likes_count' then
    update posts set likes_count = greatest(likes_count - 1, 0) where id = row_id;
  elsif col_name = 'dislikes_count' then
    update posts set dislikes_count = greatest(dislikes_count - 1, 0) where id = row_id;
  elsif col_name = 'comments_count' then
    update posts set comments_count = greatest(comments_count - 1, 0) where id = row_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- ── RPC: 댓글 카운터 증감 ────────────────────────────
create or replace function increment_comment_count(row_id uuid, col_name text)
returns void as $$
begin
  if col_name = 'likes_count' then
    update comments set likes_count = likes_count + 1 where id = row_id;
  elsif col_name = 'dislikes_count' then
    update comments set dislikes_count = dislikes_count + 1 where id = row_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function decrement_comment_count(row_id uuid, col_name text)
returns void as $$
begin
  if col_name = 'likes_count' then
    update comments set likes_count = greatest(likes_count - 1, 0) where id = row_id;
  elsif col_name = 'dislikes_count' then
    update comments set dislikes_count = greatest(dislikes_count - 1, 0) where id = row_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- ── RPC: 알림 생성 ────────────────────────────────────
create or replace function create_notification(
  p_target_user_id uuid,
  p_type text,
  p_post_id uuid,
  p_post_title text,
  p_actor_nickname text
)
returns void as $$
begin
  if auth.uid() is null or auth.uid() = p_target_user_id then
    return;
  end if;

  insert into notifications (user_id, type, post_id, post_title, actor_nickname)
  values (p_target_user_id, p_type, p_post_id, p_post_title, p_actor_nickname);

  delete from notifications
  where id in (
    select id
    from notifications
    where user_id = p_target_user_id
    order by created_at desc
    offset 100
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ── RPC: 게시글 투표 토글 (카운터 포함) ───────────────
create or replace function toggle_post_vote(
  p_post_id uuid,
  p_vote_type text
)
returns table (
  vote_type text,
  likes_count int,
  dislikes_count int
) as $$
#variable_conflict use_column
declare
  current_vote text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select pv.vote_type into current_vote
  from post_votes pv
  where pv.post_id = p_post_id and pv.user_id = auth.uid();

  if current_vote = p_vote_type then
    delete from post_votes where post_id = p_post_id and user_id = auth.uid();
    if p_vote_type = 'up' then
      update posts set likes_count = greatest(likes_count - 1, 0) where id = p_post_id;
    else
      update posts set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_post_id;
    end if;
    return query
      select null::text, p.likes_count, p.dislikes_count
      from posts p where p.id = p_post_id;
    return;
  end if;

  if current_vote is not null then
    delete from post_votes where post_id = p_post_id and user_id = auth.uid();
    if current_vote = 'up' then
      update posts set likes_count = greatest(likes_count - 1, 0) where id = p_post_id;
    else
      update posts set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_post_id;
    end if;
  end if;

  insert into post_votes (post_id, user_id, vote_type)
  values (p_post_id, auth.uid(), p_vote_type);

  if p_vote_type = 'up' then
    update posts set likes_count = likes_count + 1 where id = p_post_id;
  else
    update posts set dislikes_count = dislikes_count + 1 where id = p_post_id;
  end if;

  return query
    select p_vote_type, p.likes_count, p.dislikes_count
    from posts p where p.id = p_post_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── RPC: 댓글 투표 토글 (카운터 포함) ────────────────
create or replace function toggle_comment_vote(
  p_comment_id uuid,
  p_vote_type text
)
returns table (
  vote_type text,
  likes_count int,
  dislikes_count int
) as $$
#variable_conflict use_column
declare
  current_vote text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select cv.vote_type into current_vote
  from comment_votes cv
  where cv.comment_id = p_comment_id and cv.user_id = auth.uid();

  if current_vote = p_vote_type then
    delete from comment_votes where comment_id = p_comment_id and user_id = auth.uid();
    if p_vote_type = 'up' then
      update comments set likes_count = greatest(likes_count - 1, 0) where id = p_comment_id;
    else
      update comments set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_comment_id;
    end if;
    return query
      select null::text, c.likes_count, c.dislikes_count
      from comments c where c.id = p_comment_id;
    return;
  end if;

  if current_vote is not null then
    delete from comment_votes where comment_id = p_comment_id and user_id = auth.uid();
    if current_vote = 'up' then
      update comments set likes_count = greatest(likes_count - 1, 0) where id = p_comment_id;
    else
      update comments set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_comment_id;
    end if;
  end if;

  insert into comment_votes (comment_id, user_id, vote_type)
  values (p_comment_id, auth.uid(), p_vote_type);

  if p_vote_type = 'up' then
    update comments set likes_count = likes_count + 1 where id = p_comment_id;
  else
    update comments set dislikes_count = dislikes_count + 1 where id = p_comment_id;
  end if;

  return query
    select p_vote_type, c.likes_count, c.dislikes_count
    from comments c where c.id = p_comment_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── RPC: 프로필 레벨 즉시 동기화 (total_points → level) ──
create or replace function sync_my_level()
returns void as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update profiles
  set level = calculate_level(total_points)
  where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

-- ═══════════════════════════════════════════════════════
-- Realtime — 채팅 메시지 실시간 구독용
-- ═══════════════════════════════════════════════════════
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table notifications;

-- ═══════════════════════════════════════════════════════
-- GRANT — authenticated 역할에 RPC 실행 권한 부여
-- (Supabase 최신 프로젝트는 기본적으로 PUBLIC EXECUTE 회수)
-- ═══════════════════════════════════════════════════════
grant execute on function increment_count(uuid, text) to authenticated;
grant execute on function decrement_count(uuid, text) to authenticated;
grant execute on function increment_comment_count(uuid, text) to authenticated;
grant execute on function decrement_comment_count(uuid, text) to authenticated;
grant execute on function create_notification(uuid, text, uuid, text, text) to authenticated;
grant execute on function toggle_post_vote(uuid, text) to authenticated;
grant execute on function toggle_comment_vote(uuid, text) to authenticated;
grant execute on function sync_my_level() to authenticated;
