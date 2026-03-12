-- 투표 함수 재생성: #variable_conflict use_column 적용
-- CREATE OR REPLACE는 RETURNS TABLE 컬럼명 변경 불가하므로 DROP 후 재생성

-- ── toggle_post_vote ──────────────────────────────────
drop function if exists public.toggle_post_vote(uuid, text);

create function public.toggle_post_vote(
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
      update public.posts set likes_count = greatest(likes_count - 1, 0) where id = p_post_id;
    else
      update public.posts set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_post_id;
    end if;

    return query
      select null::text, p.likes_count, p.dislikes_count
      from public.posts p where p.id = p_post_id;
    return;
  end if;

  if current_vote is not null then
    delete from public.post_votes
    where post_id = p_post_id and user_id = auth.uid();

    if current_vote = 'up' then
      update public.posts set likes_count = greatest(likes_count - 1, 0) where id = p_post_id;
    else
      update public.posts set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_post_id;
    end if;
  end if;

  insert into public.post_votes (post_id, user_id, vote_type)
  values (p_post_id, auth.uid(), p_vote_type);

  if p_vote_type = 'up' then
    update public.posts set likes_count = likes_count + 1 where id = p_post_id;
  else
    update public.posts set dislikes_count = dislikes_count + 1 where id = p_post_id;
  end if;

  return query
    select p_vote_type, p.likes_count, p.dislikes_count
    from public.posts p where p.id = p_post_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── toggle_comment_vote ───────────────────────────────
drop function if exists public.toggle_comment_vote(uuid, text);

create function public.toggle_comment_vote(
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
      update public.comments set likes_count = greatest(likes_count - 1, 0) where id = p_comment_id;
    else
      update public.comments set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_comment_id;
    end if;

    return query
      select null::text, c.likes_count, c.dislikes_count
      from public.comments c where c.id = p_comment_id;
    return;
  end if;

  if current_vote is not null then
    delete from public.comment_votes
    where comment_id = p_comment_id and user_id = auth.uid();

    if current_vote = 'up' then
      update public.comments set likes_count = greatest(likes_count - 1, 0) where id = p_comment_id;
    else
      update public.comments set dislikes_count = greatest(dislikes_count - 1, 0) where id = p_comment_id;
    end if;
  end if;

  insert into public.comment_votes (comment_id, user_id, vote_type)
  values (p_comment_id, auth.uid(), p_vote_type);

  if p_vote_type = 'up' then
    update public.comments set likes_count = likes_count + 1 where id = p_comment_id;
  else
    update public.comments set dislikes_count = dislikes_count + 1 where id = p_comment_id;
  end if;

  return query
    select p_vote_type, c.likes_count, c.dislikes_count
    from public.comments c where c.id = p_comment_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── GRANT 재부여 ──────────────────────────────────────
grant execute on function public.toggle_post_vote(uuid, text) to authenticated;
grant execute on function public.toggle_comment_vote(uuid, text) to authenticated;
