import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Send, Coffee, ArrowLeft, Bug, Lightbulb, HelpCircle, MoreHorizontal, CheckCircle2, Clock, XCircle, Trash2, MessageSquareText, Reply, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { unwrapProfile } from "@/lib/communityTransforms"
import { LevelBadge } from "@/components/community/LevelBadge"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import type { Inquiry, InquiryCategory, InquiryStatus, UserProfile } from "@/types/community"

const CATEGORIES: { value: InquiryCategory; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "버그 신고", icon: Bug },
  { value: "feature", label: "기능 제안", icon: Lightbulb },
  { value: "question", label: "질문", icon: HelpCircle },
  { value: "other", label: "기타", icon: MoreHorizontal },
]

const STATUS_MAP: Record<InquiryStatus, { label: string; icon: typeof Clock; className: string }> = {
  open: { label: "접수됨", icon: Clock, className: "text-indigo bg-indigo/5" },
  resolved: { label: "답변 완료", icon: CheckCircle2, className: "text-success bg-success/5" },
  closed: { label: "종료", icon: XCircle, className: "text-muted-foreground bg-muted" },
}

export function ContactPage() {
  const navigate = useNavigate()
  const { user, profile: authProfile } = useAuthStore()
  const isAdmin = authProfile?.is_admin === true
  const useMock = !isSupabaseConfigured

  // Form state
  const [category, setCategory] = useState<InquiryCategory>("question")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  // List state
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Admin reply state
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyStatus, setReplyStatus] = useState<InquiryStatus>("resolved")

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchInquiries = useCallback(async () => {
    if (useMock) {
      setInquiries([])
      setIsLoading(false)
      return
    }
    try {
      let query = supabase
        .from("inquiries")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })

      // 일반 유저는 본인 것만 (RLS가 걸러주지만 명시적으로)
      if (!isAdmin && user) {
        query = query.eq("user_id", user.id)
      }

      const { data } = await query
      setInquiries((data as Inquiry[]) ?? [])
    } catch (e) {
      console.error("문의 로드 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [useMock, isAdmin, user])

  useEffect(() => { fetchInquiries() }, [fetchInquiries])

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim()) return
    setIsSending(true)

    if (useMock) {
      showToast("데모 모드에서는 문의가 저장되지 않습니다")
      setIsSending(false)
      return
    }

    try {
      const { error } = await supabase.from("inquiries").insert({
        user_id: user.id,
        category,
        title: title.trim(),
        content: content.trim(),
      })

      if (error) throw error

      showToast("문의가 접수되었습니다! 빠르게 확인하겠습니다.")
      setTitle("")
      setContent("")
      setCategory("question")
      fetchInquiries()
    } catch (e) {
      console.error("문의 전송 실패:", e)
      showToast("문의 전송에 실패했어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsSending(false)
    }
  }

  const handleAdminReply = async (inquiryId: string) => {
    if (!replyText.trim()) return
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ admin_reply: replyText.trim(), status: replyStatus })
        .eq("id", inquiryId)

      if (error) throw error

      showToast("답변이 등록되었습니다")
      setReplyingId(null)
      setReplyText("")
      fetchInquiries()
    } catch (e) {
      console.error("답변 등록 실패:", e)
      showToast("답변 등록에 실패했어요")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await supabase.from("inquiries").delete().eq("id", deleteId)
      setDeleteId(null)
      fetchInquiries()
    } catch (e) {
      console.error("문의 삭제 실패:", e)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-14 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </button>

      <h1 className="mb-2 flex items-center gap-2 text-headline font-bold"><MessageSquareText className="h-6 w-6" />개발자에게 의견 보내기</h1>
      <p className="mb-8 text-body-sm text-muted-foreground">
        버그 신고, 기능 제안, 질문 등 자유롭게 남겨주세요. 소중한 의견 감사합니다!
      </p>

      {/* ── 문의 폼 ────────────────────────────── */}
      <div className="card-elevated mb-8 rounded-2xl p-6">
        <h2 className="mb-5 flex items-center gap-2 text-body-sm font-semibold">
          <MessageSquareText className="h-4 w-4" />
          새 문의 작성
        </h2>

        {/* 카테고리 */}
        <div className="mb-3">
          <label className="mb-1.5 block text-caption font-medium text-muted-foreground">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-body-sm font-medium transition-colors ${
                    category === cat.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-3">
          <label className="mb-1.5 block text-caption font-medium text-muted-foreground">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문의 제목을 입력하세요"
            maxLength={100}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 내용 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-caption font-medium text-muted-foreground">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상세한 내용을 작성해주세요"
            rows={5}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-body-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-1.5 text-right text-caption text-muted-foreground">{content.length}/2000</div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSending || !title.trim() || !content.trim()}
          className="btn-gradient btn-base btn-md w-full gap-2 rounded-xl"
        >
          <Send className="h-4 w-4" />
          문의 보내기
        </Button>
      </div>

      {/* ── 커피 사주기 ───────────────────────── */}
      <div className="mb-8 rounded-2xl border border-warning/20 bg-warning/5 p-6 text-center">
        <Coffee className="mx-auto mb-2 h-8 w-8 text-warning" />
        <h3 className="mb-1 text-body-sm font-semibold">개발자에게 커피 사주기</h3>
        <p className="mb-4 text-caption text-muted-foreground">
          타비톡이 유용하셨다면 커피 한 잔으로 응원해주세요!
        </p>
        <Button
          variant="outline"
          className="btn-base btn-md gap-2 rounded-xl border-warning/40 text-warning hover:bg-warning/10"
          onClick={() => showToast("준비 중입니다! 곧 오픈할게요.")}
        >
          <Coffee className="h-4 w-4" />
          커피 한 잔 보내기
        </Button>
      </div>

      {/* ── 문의 목록 ─────────────────────────── */}
      <div className="card-elevated rounded-2xl p-6">
        <h2 className="mb-5 flex items-center gap-2 text-body-sm font-semibold">
          <ClipboardList className="h-4 w-4" />
          {isAdmin ? "전체 문의 목록 (관리자)" : "내 문의 내역"}
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-body-sm text-muted-foreground">불러오는 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="py-8 text-center text-body-sm text-muted-foreground">
            {isAdmin ? "접수된 문의가 없습니다" : "아직 문의 내역이 없습니다"}
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => {
              const catInfo = CATEGORIES.find((c) => c.value === inquiry.category) ?? CATEGORIES[3]
              const statusInfo = STATUS_MAP[inquiry.status] ?? STATUS_MAP.open
              const StatusIcon = statusInfo.icon
              const CatIcon = catInfo.icon
              const prof = unwrapProfile(inquiry.profiles) as UserProfile | null

              return (
                <div key={inquiry.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  {/* 헤더 */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium ${statusInfo.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-caption text-muted-foreground">
                          <CatIcon className="h-3 w-3" />
                          {catInfo.label}
                        </span>
                      </div>
                      <h3 className="text-body-sm font-medium">{inquiry.title}</h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(inquiry.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 작성자 (관리자 뷰) */}
                  {isAdmin && prof && (
                    <div className="mb-2 flex items-center gap-1.5">
                      {prof.avatar_url ? (
                        <img src={prof.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold">
                          {prof.nickname.charAt(0)}
                        </div>
                      )}
                      <span className="text-caption text-muted-foreground">{prof.nickname}</span>
                      <LevelBadge level={prof.level} totalPoints={prof.total_points} isAdmin={prof.is_admin} compact />
                    </div>
                  )}

                  {/* 내용 */}
                  <p className="mb-2 whitespace-pre-wrap text-body-sm leading-relaxed text-muted-foreground">
                    {inquiry.content}
                  </p>

                  <div className="text-caption text-muted-foreground">
                    {new Date(inquiry.created_at).toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* 관리자 답변 */}
                  {inquiry.admin_reply && (
                    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-1 flex items-center gap-1 text-caption font-medium text-primary">
                        <Reply className="h-3 w-3" />
                        관리자 답변
                      </div>
                      <p className="whitespace-pre-wrap text-body-sm leading-relaxed">{inquiry.admin_reply}</p>
                    </div>
                  )}

                  {/* 관리자 답변 입력 */}
                  {isAdmin && replyingId === inquiry.id && (
                    <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/50 p-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="답변을 입력하세요"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value as InquiryStatus)}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-body-sm"
                        >
                          <option value="resolved">답변 완료</option>
                          <option value="closed">종료</option>
                          <option value="open">접수됨</option>
                        </select>
                        <Button size="sm" className="ml-auto gap-1 rounded-xl text-body-sm" onClick={() => handleAdminReply(inquiry.id)}>
                          <Send className="h-3 w-3" />
                          답변 등록
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl text-body-sm" onClick={() => setReplyingId(null)}>
                          취소
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 관리자 답변 버튼 */}
                  {isAdmin && replyingId !== inquiry.id && (
                    <button
                      onClick={() => { setReplyingId(inquiry.id); setReplyText(inquiry.admin_reply ?? ""); setReplyStatus(inquiry.status === "open" ? "resolved" : inquiry.status) }}
                      className="mt-2 inline-flex items-center gap-1 text-caption text-primary hover:underline"
                    >
                      <Reply className="h-3 w-3" />
                      {inquiry.admin_reply ? "답변 수정" : "답변하기"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="문의를 삭제하시겠습니까?"
        description="삭제된 문의는 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
