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
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // 낙관적 메시지 ID 추적 — Realtime으로 실제 메시지 도착 시 교체
  const pendingIdsRef = useRef<Set<string>>(new Set())

  const useSupabase = isSupabaseConfigured && !isDemoMode

  // 초기 메시지 로드 (한 번만)
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

  // Supabase Realtime 구독 — INSERT 이벤트만 수신
  useEffect(() => {
    if (!open || !useSupabase) return

    void loadMessages()

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes" as "system",
        { event: "INSERT", schema: "public", table: "chat_messages" } as Record<string, string>,
        (payload: { new: ChatMessage }) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            // 낙관적 메시지가 있으면 교체, 없으면 추가 (타인의 메시지)
            if (pendingIdsRef.current.size > 0) {
              // content+user_id 매칭으로 낙관적 메시지 찾아 교체
              const pendingIdx = prev.findIndex(
                (m) => pendingIdsRef.current.has(m.id) && m.user_id === newMsg.user_id && m.content === newMsg.content,
              )
              if (pendingIdx >= 0) {
                pendingIdsRef.current.delete(prev[pendingIdx].id)
                const updated = [...prev]
                updated[pendingIdx] = newMsg
                return updated
              }
            }
            // 중복 방지
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, useSupabase, loadMessages])

  // Mock 모드: 초기 로드만 (폴링 불필요 — 현재 사용자만 메시지 씀)
  useEffect(() => {
    if (!open || useSupabase) return
    void loadMessages()
  }, [open, useSupabase, loadMessages])

  // 새 메시지 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // 모바일 가상 키보드 대응
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      const el = chatRef.current
      if (!el) return
      const keyboardOffset = window.innerHeight - vv.height - vv.offsetTop
      if (keyboardOffset > 50) {
        el.style.bottom = `${keyboardOffset + 8}px`
        el.style.maxHeight = `${vv.height - 16}px`
      } else {
        el.style.bottom = ""
        el.style.maxHeight = ""
      }
      bottomRef.current?.scrollIntoView({ behavior: "instant" })
    }

    vv.addEventListener("resize", handleResize)
    vv.addEventListener("scroll", handleResize)
    return () => {
      vv.removeEventListener("resize", handleResize)
      vv.removeEventListener("scroll", handleResize)
    }
  }, [open])

  const handleSend = async () => {
    if (!user || !profile) {
      setShowLoginModal(true)
      return
    }
    const trimmed = input.trim()
    if (!trimmed || sending) return

    const optimisticId = crypto.randomUUID()
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      user_id: user.id,
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    pendingIdsRef.current.add(optimisticId)
    setMessages((prev) => [...prev, optimisticMsg])
    setInput("")
    setSending(true)

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
        pendingIdsRef.current.delete(optimisticId)
      }
    } catch (e) {
      console.error("채팅 전송 실패:", e)
      pendingIdsRef.current.delete(optimisticId)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    } finally {
      setSending(false)
    }
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
    <div ref={chatRef} className="fixed bottom-6 right-6 z-50 flex h-[28rem] max-h-[calc(100dvh-3rem)] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96 transition-[bottom,max-height] duration-150">
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
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={user ? "메시지를 입력하세요..." : "로그인 후 채팅 가능"}
            maxLength={300}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
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
