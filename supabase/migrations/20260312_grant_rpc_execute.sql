-- Grant EXECUTE on all client-facing RPC functions to authenticated role.
-- Supabase projects created after 2022-03 revoke PUBLIC EXECUTE by default.

grant execute on function public.increment_count(uuid, text) to authenticated;
grant execute on function public.decrement_count(uuid, text) to authenticated;
grant execute on function public.increment_comment_count(uuid, text) to authenticated;
grant execute on function public.decrement_comment_count(uuid, text) to authenticated;
grant execute on function public.create_notification(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.toggle_post_vote(uuid, text) to authenticated;
grant execute on function public.toggle_comment_vote(uuid, text) to authenticated;
grant execute on function public.sync_my_level() to authenticated;
