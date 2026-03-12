-- Grant EXECUTE on all client-facing RPC functions to authenticated role.
-- Supabase projects created after 2022-03 revoke PUBLIC EXECUTE by default.

-- sync_my_level was missing from previous migrations — create it first
create or replace function public.sync_my_level()
returns void as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set level = public.calculate_level(total_points)
  where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_count(uuid, text) to authenticated;
grant execute on function public.decrement_count(uuid, text) to authenticated;
grant execute on function public.increment_comment_count(uuid, text) to authenticated;
grant execute on function public.decrement_comment_count(uuid, text) to authenticated;
grant execute on function public.create_notification(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.toggle_post_vote(uuid, text) to authenticated;
grant execute on function public.toggle_comment_vote(uuid, text) to authenticated;
grant execute on function public.sync_my_level() to authenticated;
