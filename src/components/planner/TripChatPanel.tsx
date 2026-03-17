import { useState, useEffect, useRef, useCallback, useLayoutEffect, memo } from "react"
import { Send, MessageSquare, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import {
  loadRecentMessages,
  loadOlderMessages,
  sendMessage,
  subscribeTripChat,
  CHAT_PAGE_SIZE,
  type TripChatMessage,
} from "@/services/tripChatService"

interface TripChatPanelProps {
  sharedId: string
}

export function TripChatPanel({ sharedId }: TripChatPanelProps) {
  const { user, profile, setShowLoginModal } = useAuthStore()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<TripChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(false)
  const [unread, setUnread] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingIdsRef = useRef<Set<string>>(new Set())
  const isLoadingOlderRef = useRef(false)
  const isNearBottomRef = useRef(true)
  const messagesRef = useRef<TripChatMessage[]>([])
  const openRef = useRef(false)
  messagesRef.current = messages
  openRef.current = open

  // ── 최근 메시지 로드 ──────────────────────────────
  const loadRecent = useCallback(async () => {
    setInitialLoading(true)
    try {
      const data = await loadRecentMessages(sharedId)
      setMessages(data)
      setHasMore(data.length >= CHAT_PAGE_SIZE)
    } catch (e) {
      console.error("채팅 로드 실패:", e)
    } finally {
      setInitialLoading(false)
    }
  }, [sharedId])

  // ── 이전 메시지 페이지네이션 ──────────────────────
  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || messagesRef.current.length === 0) return
    const oldestMsg = messagesRef.current[0]
    setLoadingOlder(true)
    isLoadingOlderRef.current = true

    try {
      const data = await loadOlderMessages(sharedId, oldestMsg.created_at)
      setMessages((prev) => [...data, ...prev])
      setHasMore(data.length >= CHAT_PAGE_SIZE)
    } catch (e) {
      console.error("이전 메시지 로드 실패:", e)
    } finally {
      setLoadingOlder(false)
    }
  }, [sharedId, loadingOlder, hasMore])

  // ── Realtime 구독 (패널 열림 여부와 무관하게 항상 구독) ─
  useEffect(() => {
    void loadRecent()

    const cleanup = subscribeTripChat(sharedId, (newMsg) => {
      setMessages((prev) => {
        // Optimistic 메시지 치환
        if (pendingIdsRef.current.size > 0) {
          const pendingIdx = prev.findIndex(
            (m) =>
              pendingIdsRef.current.has(m.id) &&
              m.user_id === newMsg.user_id &&
              m.content === newMsg.content,
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

      // 패널이 닫혀있고 내 메시지가 아니면 unread 카운트 증가
      if (!openRef.current && newMsg.user_id !== user?.id) {
        setUnread((c) => c + 1)
      }
    })

    return cleanup
  }, [sharedId, loadRecent, user?.id])

  // ── 패널 열릴 때 unread 초기화 ────────────────────
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  // ── 스크롤 최상단 → 이전 메시지 로드 ───────────────
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !open) return

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight
      isNearBottomRef.current = distanceFromBottom < 80

      if (container.scrollTop < 40 && hasMore && !loadingOlder) {
        loadOlder()
      }
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [open, hasMore, loadingOlder, loadOlder])

  // ── 이전 메시지 로드 후 스크롤 위치 복원 ──────────
  const prevScrollHeightRef = useRef(0)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !isLoadingOlderRef.current) return
    const newScrollHeight = container.scrollHeight
    container.scrollTop = newScrollHeight - prevScrollHeightRef.current
    isLoadingOlderRef.current = false
  }, [messages])

  useEffect(() => {
    if (loadingOlder) {
      prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0
    }
  }, [loadingOlder])

  // ── 새 메시지 시 하단 근처면 자동 스크롤 ──────────
  useEffect(() => {
    if (!initialLoading && !isLoadingOlderRef.current && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, initialLoading])

  // ── 초기 로드 완료 시 맨 아래로 ───────────────
  useEffect(() => {
    if (!initialLoading && messages.length > 0 && open) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialLoading false 전환 시 1회만
  }, [initialLoading])

  // ── 모바일 가상 키보드 대응 ────────────────
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

  // ── 메시지 전송 ─────────────────────────────
  const handleSend = async () => {
    if (!user || !profile) {
      setShowLoginModal(true)
      return
    }
    const trimmed = input.trim()
    if (!trimmed || sending) return

    const optimisticId = crypto.randomUUID()
    const optimisticMsg: TripChatMessage = {
      id: optimisticId,
      trip_id: sharedId,
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
      await sendMessage(sharedId, user.id, profile.nickname, profile.avatar_url, trimmed)
    } catch (e) {
      console.error("채팅 전송 실패:", e)
      pendingIdsRef.current.delete(optimisticId)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    } finally {
      setSending(false)
    }
  }

  // ── FAB (닫힌 상태) ───────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6"
        aria-label="여행 채팅 열기"
      >
        <MessageSquare className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    )
  }

  // ── 패널 (열린 상태) ────────────────────────
  return (
    <div
      ref={chatRef}
      className="fixed bottom-36 right-2 z-50 flex h-[28rem] max-h-[calc(100dvh-10rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96 lg:bottom-6 lg:right-6 lg:w-80 lg:max-h-[calc(100dvh-3rem)] transition-[bottom,max-height] duration-150"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <span className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare className="h-4 w-4" />
          여행 채팅
        </span>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
      >
        {loadingOlder && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              이전 메시지를 불러오는 중...
            </span>
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <p className="py-2 text-center text-[10px] text-muted-foreground">
            — 처음 메시지입니다 —
          </p>
        )}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">
              채팅을 불러오는 중...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            아직 메시지가 없어요. 팀원에게 첫 메시지를 보내보세요!
          </p>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isMe={msg.user_id === user?.id}
            />
          ))
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
            maxLength={500}
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

// ── 채팅 말풍선 ─────────────────────────────────
const ChatBubble = memo(function ChatBubble({
  msg,
  isMe,
}: {
  msg: TripChatMessage
  isMe: boolean
}) {
  return (
    <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
      {!isMe &&
        (msg.avatar_url ? (
          <img
            src={msg.avatar_url}
            alt=""
            className="mt-1 h-6 w-6 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
            {msg.nickname.charAt(0)}
          </div>
        ))}
      <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
        <p
          className={`mb-0.5 text-[10px] font-medium text-muted-foreground ${isMe ? "text-right" : ""}`}
        >
          {msg.nickname}
        </p>
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
          {new Date(msg.created_at).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
})
