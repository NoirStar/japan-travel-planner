-- ═══════════════════════════════════════════════════════
-- タビトーク (TabiTalk) — Supabase Schema
-- Auth + 프로필 + 커뮤니티 (게시글, 추천, 댓글)
-- ═══════════════════════════════════════════════════════

-- ── 프로필 테이블 ─────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  total_likes int not null default 0,
  level int not null default 1,
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

-- ── 추천/비추천 투표 ──────────────────────────────────
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
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on comments (post_id, created_at);

-- ── RLS 정책 ──────────────────────────────────────────
alter table profiles enable row level security;
alter table posts enable row level security;
alter table post_votes enable row level security;
alter table comments enable row level security;

-- profiles: 누구나 조회, 본인만 수정
create policy "프로필 공개 조회" on profiles for select using (true);
create policy "본인 프로필 수정" on profiles for update using (auth.uid() = id);
create policy "프로필 생성" on profiles for insert with check (auth.uid() = id);

-- posts: 누구나 조회, 로그인한 사용자만 작성, 본인만 삭제
create policy "게시글 공개 조회" on posts for select using (true);
create policy "게시글 작성" on posts for insert with check (auth.uid() = user_id);
create policy "본인 게시글 삭제" on posts for delete using (auth.uid() = user_id);

-- post_votes: 누구나 조회, 로그인한 사용자만 투표
create policy "투표 조회" on post_votes for select using (true);
create policy "투표 등록" on post_votes for insert with check (auth.uid() = user_id);
create policy "투표 삭제" on post_votes for delete using (auth.uid() = user_id);

-- comments: 누구나 조회, 로그인한 사용자만 작성, 본인만 삭제
create policy "댓글 조회" on comments for select using (true);
create policy "댓글 작성" on comments for insert with check (auth.uid() = user_id);
create policy "본인 댓글 삭제" on comments for delete using (auth.uid() = user_id);

-- ── 트리거: 추천 수 → 프로필 레벨 자동 업데이트 ─────
create or replace function update_user_level()
returns trigger as $$
declare
  total int;
  new_level int;
begin
  select coalesce(sum(p.likes_count), 0) into total
  from posts p where p.user_id = coalesce(new.user_id, old.user_id);

  if total >= 50 then new_level := 4;
  elsif total >= 20 then new_level := 3;
  elsif total >= 5 then new_level := 2;
  else new_level := 1;
  end if;

  update profiles set total_likes = total, level = new_level
  where id = coalesce(new.user_id, old.user_id);

  return new;
end;
$$ language plpgsql security definer;

-- 게시글의 likes_count가 변경될 때 레벨 재계산
create or replace trigger on_post_likes_change
  after update of likes_count on posts
  for each row execute function update_user_level();

-- ── RPC: 카운터 증감 ─────────────────────────────────
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

-- ── 신규 유저 자동 프로필 생성 ────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'タビ' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
