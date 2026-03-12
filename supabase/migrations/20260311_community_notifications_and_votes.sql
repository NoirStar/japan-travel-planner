-- Community notifications, auth-safe free-board updates, and fast vote toggles.

-- ── notifications table ─────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('comment', 'like')),
  post_id uuid not null references public.posts(id) on delete cascade,
  post_title text not null,
  actor_nickname text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- ── policies ────────────────────────────────────────────
drop policy if exists "게시글 수정" on public.posts;
create policy "게시글 수정" on public.posts for update using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  )
) with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  )
);

drop policy if exists "알림 조회" on public.notifications;
create policy "알림 조회" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "알림 읽음 처리" on public.notifications;
create policy "알림 읽음 처리" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── rpc: create notification ───────────────────────────
create or replace function public.create_notification(
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

  insert into public.notifications (user_id, type, post_id, post_title, actor_nickname)
  values (p_target_user_id, p_type, p_post_id, p_post_title, p_actor_nickname);

  delete from public.notifications
  where id in (
    select id
    from public.notifications
    where user_id = p_target_user_id
    order by created_at desc
    offset 100
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ── rpc: fast post vote toggle ─────────────────────────
create or replace function public.toggle_post_vote(
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
  from public.post_votes pv
  where pv.post_id = p_post_id and pv.user_id = auth.uid();

  if current_vote = p_vote_type then
    delete from public.post_votes
    where post_id = p_post_id and user_id = auth.uid();

    if p_vote_type = 'up' then
      update public.posts
      set likes_count = greatest(likes_count - 1, 0)
      where id = p_post_id;
    else
      update public.posts
      set dislikes_count = greatest(dislikes_count - 1, 0)
      where id = p_post_id;
    end if;

    return query
    select null::text, p.likes_count, p.dislikes_count
    from public.posts p
    where p.id = p_post_id;
    return;
  end if;

  if current_vote is not null then
    delete from public.post_votes
    where post_id = p_post_id and user_id = auth.uid();

    if current_vote = 'up' then
      update public.posts
      set likes_count = greatest(likes_count - 1, 0)
      where id = p_post_id;
    else
      update public.posts
      set dislikes_count = greatest(dislikes_count - 1, 0)
      where id = p_post_id;
    end if;
  end if;

  insert into public.post_votes (post_id, user_id, vote_type)
  values (p_post_id, auth.uid(), p_vote_type);

  if p_vote_type = 'up' then
    update public.posts
    set likes_count = likes_count + 1
    where id = p_post_id;
  else
    update public.posts
    set dislikes_count = dislikes_count + 1
    where id = p_post_id;
  end if;

  return query
  select p_vote_type, p.likes_count, p.dislikes_count
  from public.posts p
  where p.id = p_post_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── rpc: fast comment vote toggle ──────────────────────
create or replace function public.toggle_comment_vote(
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
  from public.comment_votes cv
  where cv.comment_id = p_comment_id and cv.user_id = auth.uid();

  if current_vote = p_vote_type then
    delete from public.comment_votes
    where comment_id = p_comment_id and user_id = auth.uid();

    if p_vote_type = 'up' then
      update public.comments
      set likes_count = greatest(likes_count - 1, 0)
      where id = p_comment_id;
    else
      update public.comments
      set dislikes_count = greatest(dislikes_count - 1, 0)
      where id = p_comment_id;
    end if;

    return query
    select null::text, c.likes_count, c.dislikes_count
    from public.comments c
    where c.id = p_comment_id;
    return;
  end if;

  if current_vote is not null then
    delete from public.comment_votes
    where comment_id = p_comment_id and user_id = auth.uid();

    if current_vote = 'up' then
      update public.comments
      set likes_count = greatest(likes_count - 1, 0)
      where id = p_comment_id;
    else
      update public.comments
      set dislikes_count = greatest(dislikes_count - 1, 0)
      where id = p_comment_id;
    end if;
  end if;

  insert into public.comment_votes (comment_id, user_id, vote_type)
  values (p_comment_id, auth.uid(), p_vote_type);

  if p_vote_type = 'up' then
    update public.comments
    set likes_count = likes_count + 1
    where id = p_comment_id;
  else
    update public.comments
    set dislikes_count = dislikes_count + 1
    where id = p_comment_id;
  end if;

  return query
  select p_vote_type, c.likes_count, c.dislikes_count
  from public.comments c
  where c.id = p_comment_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── realtime publication ───────────────────────────────
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;