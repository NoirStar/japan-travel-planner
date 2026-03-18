-- ── Atomic comment add: INSERT + counter in single transaction ───
create or replace function add_comment(
  p_post_id uuid,
  p_user_id uuid,
  p_content  text
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into comments (post_id, user_id, content)
  values (p_post_id, p_user_id, p_content)
  returning id into v_id;

  update posts
  set comments_count = comments_count + 1
  where id = p_post_id;

  return v_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ── Atomic comment delete: DELETE + counter in single transaction ─
create or replace function delete_comment(
  p_comment_id uuid,
  p_post_id    uuid
)
returns void as $$
begin
  delete from comments where id = p_comment_id;

  update posts
  set comments_count = greatest(comments_count - 1, 0)
  where id = p_post_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Grant execute to authenticated users
grant execute on function add_comment(uuid, uuid, text) to authenticated;
grant execute on function delete_comment(uuid, uuid) to authenticated;
