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
  title text not null,
  description text,
  city_id text not null,
  cover_image text,
  trip_data jsonb not null,          -- 여행 일정 전체 (Trip 구조)
  likes_count int not null default 0,
  dislikes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- ═══════════════════════════════════════════════════════
-- RLS 정책
-- ═══════════════════════════════════════════════════════
alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_votes enable row level security;
alter table comments enable row level security;
alter table comment_votes enable row level security;
alter table chat_messages enable row level security;

-- profiles: 누구나 조회, 본인만 수정
create policy "프로필 공개 조회" on profiles for select using (true);
create policy "본인 프로필 수정" on profiles for update using (auth.uid() = id);
create policy "프로필 생성" on profiles for insert with check (auth.uid() = id);

-- posts: 누구나 조회, 로그인한 사용자만 작성, 본인 또는 관리자만 삭제
create policy "게시글 공개 조회" on posts for select using (true);
create policy "게시글 작성" on posts for insert with check (auth.uid() = user_id);
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

-- chat_messages: 누구나 조회, 로그인한 사용자만 작성
create policy "채팅 조회" on chat_messages for select using (true);
create policy "채팅 작성" on chat_messages for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- 함수 & 트리거
-- ═══════════════════════════════════════════════════════

-- ── 신규 유저 자동 프로필 생성 ────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'タビ' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url'
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
  new_level int;
begin
  select coalesce(sum(p.likes_count), 0) into total_likes_val
  from posts p where p.user_id = coalesce(new.user_id, old.user_id);

  -- 포인트 = 좋아요 × 10 (나머지 포인트는 클라이언트에서 관리)
  pts := total_likes_val * 10;
  new_level := calculate_level(pts);

  update profiles
  set total_likes = total_likes_val,
      total_points = greatest(total_points, pts),
      level = new_level
  where id = coalesce(new.user_id, old.user_id);

  return new;
end;
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;

create or replace function decrement_comment_count(row_id uuid, col_name text)
returns void as $$
begin
  if col_name = 'likes_count' then
    update comments set likes_count = greatest(likes_count - 1, 0) where id = row_id;
  elsif col_name = 'dislikes_count' then
    update comments set dislikes_count = greatest(dislikes_count - 1, 0) where id = row_id;
  end if;
end;
$$ language plpgsql security definer;
