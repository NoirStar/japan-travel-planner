import { supabase } from "@/lib/supabase"
import type { Notification, NotificationType } from "@/types/community"

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  postId: string
  postTitle: string
  actorNickname: string
}

export async function fetchNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) throw error
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { error } = await supabase.rpc("create_notification", {
    p_actor_nickname: input.actorNickname,
    p_post_id: input.postId,
    p_post_title: input.postTitle,
    p_target_user_id: input.userId,
    p_type: input.type,
  })

  if (error) throw error
}
