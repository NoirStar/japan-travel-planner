import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { createMockFreePost } from "@/lib/mockCommunity"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateFreePostModal({ open, onClose, onCreated }: Props) {
  const { user, refreshDemoProfile } = useAuthStore()
  const useMock = !isSupabaseConfigured

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError("")

    try {
      if (useMock) {
        createMockFreePost(user.id, title.trim(), content.trim())
        refreshDemoProfile()
      } else {
        const { error: insertError } = await supabase.from("posts").insert({
          user_id: user.id,
          board_type: "free",
          title: title.trim(),
          content: content.trim(),
          city_id: "",
          trip_data: {},
        })
        if (insertError) {
          console.error("글 작성 실패:", insertError)
          setError(`작성 실패: ${insertError.message}`)
          return
        }
      }
      setTitle("")
      setContent("")
      onCreated()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold">글 작성</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              rows={8}
              maxLength={5000}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{content.length}/5000</p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
            className="gap-2 rounded-xl"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "작성 중..." : "작성"}
          </Button>
        </div>
      </div>
    </div>
  )
}
