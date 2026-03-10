import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react"
import { Send, MessageSquare, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getChatMessages, addChatMessage } from "@/lib/mockCommunity"
import type { ChatMessage } from "@/lib/mockCommunity"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

const PAGE_SIZE = 20

export function ChatPanel() {
  const { user, profile, isDemoMode, setShowLoginModal } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingIdsRef = useRef<Set<string>>(new Set())
  const isLoadingOlderRef = useRef(false)
  const isNearBottomRef = useRef(true)

  const useSupabase = isSupabaseConfigured && !isDemoMode

  // 최근 N개만 로드 (내림차순 → 뒤집기)
  const loadRecentMessages = useCallback(async () => {
    setInitialLoading(true)
    try {
      if (useSupabase) {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE)
        if (data) {
          const sorted = [...data].reverse()
          setMessages(sorted)
          setHasMore(data.length >= PAGE_SIZE)
        }
      } else {
        const all = getChatMessages()
        const recent = all.slice(-PAGE_SIZE)
        setMessages(recent)
        setHasMore(all.length > PAGE_SIZE)
      }
    } catch (e) {
      console.error("채팅 로드 실패:", e)
    } finally {
      setInitialLoading(false)
    }
  }, [useSupabase])

  // 위로 스크롤 시 이전 메시지 로드
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return
    const oldestMsg = messages[0]
    setLoadingOlder(true)
    isLoadingOlderRef.current = true

    const container = scrollContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    try {
      if (useSupabase) {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .lt("created_at", oldestMsg.created_at)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE)
        if (data) {
          const sorted = [...data].reverse()
          setMessages((prev) => [...sorted, ...prev])
          setHasMore(data.length >= PAGE_SIZE)
        }
      } else {
        const all = getChatMessages()
        const idx = all.findIndex((m) => m.id === oldestMsg.id)
        if (idx > 0) {
          const older = all.slice(Math.max(0, idx - PAGE_SIZE), idx)
          setMessages((prev) => [...older, ...prev])
          setHasMore(idx - PAGE_SIZE > 0)
        } else {
          setHasMore(false)
        }
      }
    } catch (e) {
      console.error("이전 메시지 로드 실패:", e)
    } finally {
      setLoadingOlder(false)
    }
  }, [loadingOlder, hasMore, messages, useSupabase])

  // 스크롤 최상단 감지 → 이전 메시지 로드
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !open) return

    const handleScroll = () => {
      // 하단 근처(80px 이내)인지 추적
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      isNearBottomRef.current = distanceFromBottom < 80

      if (container.scrollTop < 40 && hasMore && !loadingOlder) {
        loadOlderMessages()
      }
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [open, hasMore, loadingOlder, loadOlderMessages])

  // Supabase Realtime 구독
  useEffect(() => {
    if (!open || !useSupabase) return

    void loadRecentMessages()

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes" as "system",
        { event: "INSERT", schema: "public", table: "chat_messages" } as Record<string, string>,
        (payload: { new: ChatMessage }) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            if (pendingIdsRef.current.size > 0) {
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
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, useSupabase, loadRecentMessages])

  // Mock 모드: 초기 로드만
  useEffect(() => {
    if (!open || useSupabase) return
    void loadRecentMessages()
  }, [open, useSupabase, loadRecentMessages])

  // 이전 메시지 로드 후 스크롤 위치 복원 (DOM 변경 직후 실행)
  const prevScrollHeightRef = useRef(0)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !isLoadingOlderRef.current) return
    const newScrollHeight = container.scrollHeight
    container.scrollTop = newScrollHeight - prevScrollHeightRef.current
    isLoadingOlderRef.current = false
  }, [messages])

  // 이전 메시지 로드 시작 시 현재 scrollHeight 저장
  useEffect(() => {
    if (loadingOlder) {
      prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0
    }
  }, [loadingOlder])

  // 새 메시지 시 하단 근처면 맨 아래로 스크롤
  useEffect(() => {
    if (!initialLoading && !isLoadingOlderRef.current && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, initialLoading])

  // 초기 로드 완료 시 맨 아래로 스크롤 (instant)
  useEffect(() => {
    if (!initialLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initialLoading false 전환 시 1회만
  }, [initialLoading])

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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* 이전 메시지 로딩 인디케이터 */}
        {loadingOlder && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">이전 메시지를 불러오는 중...</span>
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <p className="py-2 text-center text-[10px] text-muted-foreground">— 처음 메시지입니다 —</p>
        )}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">채팅을 불러오는 중...</span>
          </div>
        ) : messages.length === 0 ? (
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
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
