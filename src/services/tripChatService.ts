import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export interface TripChatMessage {
  id: string
  trip_id: string
  user_id: string
  nickname: string
  avatar_url: string | null
  content: string
  created_at: string
}

const PAGE_SIZE = 30

/** 최근 메시지 로드 (내림차순 → 오래된순 정렬) */
export async function loadRecentMessages(tripId: string): Promise<TripChatMessage[]> {
  const { data } = await supabase
    .from("trip_chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  return data ? [...data].reverse() : []
}

/** 이전 메시지 로드 (페이지네이션) */
export async function loadOlderMessages(
  tripId: string,
  beforeDate: string,
): Promise<TripChatMessage[]> {
  const { data } = await supabase
    .from("trip_chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .lt("created_at", beforeDate)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  return data ? [...data].reverse() : []
}

/** 메시지 전송 */
export async function sendMessage(
  tripId: string,
  userId: string,
  nickname: string,
  avatarUrl: string | null,
  content: string,
): Promise<void> {
  const { error } = await supabase.from("trip_chat_messages").insert({
    trip_id: tripId,
    user_id: userId,
    nickname,
    avatar_url: avatarUrl,
    content,
  })
  if (error) throw error
}

/** 실시간 채팅 채널 구독. cleanup 함수 반환 */
export function subscribeTripChat(
  tripId: string,
  onNewMessage: (msg: TripChatMessage) => void,
): () => void {
  const channel = supabase
    .channel(`trip-chat:${tripId}`)
    .on(
      "postgres_changes" as "system",
      {
        event: "INSERT",
        schema: "public",
        table: "trip_chat_messages",
        filter: `trip_id=eq.${tripId}`,
      } as Record<string, string>,
      (payload: { new: TripChatMessage }) => {
        onNewMessage(payload.new)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export { PAGE_SIZE as CHAT_PAGE_SIZE }

export function isChatAvailable(): boolean {
  return isSupabaseConfigured
}
