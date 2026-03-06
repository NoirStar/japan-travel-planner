import { useState, useEffect, useRef, useCallback } from "react"
import { Send, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getChatMessages, addChatMessage } from "@/lib/mockCommunity"
import type { ChatMessage } from "@/lib/mockCommunity"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

export function ChatPanel() {
  const { user, profile, isDemoMode, setShowLoginModal } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 데모 모드에서는 항상 로컬 mock 사용 (Supabase 설정 여부와 무관)
  const useSupabase = isSupabaseConfigured && !isDemoMode

  const loadMessages = useCallback(async () => {
    try {
      if (useSupabase) {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(100)
        if (data) setMessages(data as ChatMessage[])
      } else {
        setMessages(getChatMessages())
      }
    } catch (e) {
      console.error("채팅 로드 실패:", e)
    }
  }, [useSupabase])

  // 폴링으로 메시지 갱신
  useEffect(() => {
    if (!open) return
    loadMessages()
    intervalRef.current = setInterval(loadMessages, 2000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open, loadMessages])

  // 새 메시지 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const handleSend = async () => {
    if (!user || !profile) {
      setShowLoginModal(true)
      return
    }
    const trimmed = input.trim()
    if (!trimmed) return
    try {
      if (useSupabase) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          nickname: profile.nickname,
          avatar_url: profile.avatar_url,
          content: trimmed,
        })
      } else {
        addChatMessage(user.id, profile.nickname, profile.avatar_url, trimmed)
      }
    } catch (e) {
      console.error("채팅 전송 실패:", e)
    }
    setInput("")
    loadMessages()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
        aria-label="채팅 열기"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <span className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4" />
          실시간 채팅
        </span>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            아직 메시지가 없어요. 첫 메시지를 보내보세요!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {/* 아바타 */}
                {!isMe && (
                  msg.avatar_url ? (
                    <img src={msg.avatar_url} alt="" className="mt-1 h-6 w-6 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                      {msg.nickname.charAt(0)}
                    </div>
                  )
                )}
                <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  <p className={`mb-0.5 text-[10px] font-medium text-muted-foreground ${isMe ? "text-right" : ""}`}>{msg.nickname}</p>
                  <div
                    className={`inline-block rounded-2xl px-3 py-1.5 text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={user ? "메시지를 입력하세요..." : "로그인 후 채팅 가능"}
            maxLength={300}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
