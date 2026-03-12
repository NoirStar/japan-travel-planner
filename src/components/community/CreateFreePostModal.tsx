import { useState, useRef } from "react"
import { X, Loader2, ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { createMockFreePost } from "@/lib/mockCommunity"
import { uploadImage } from "@/lib/uploadImage"

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
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setError("")
    const result = await uploadImage(file)
    setIsUploading(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    setCoverImage(result.url)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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
          cover_image: coverImage,
          trip_data: {},
        })
        if (insertError) {
          console.error("글 작성 실패:", insertError)
          setError("글 작성에 실패했어요. 잠시 후 다시 시도해주세요.")
          return
        }
      }
      setTitle("")
      setContent("")
      setCoverImage(null)
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

          {/* 이미지 첨부 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">이미지 첨부</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={coverImage} alt="첨부 이미지" className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                {isUploading ? "업로드 중..." : "이미지 추가"}
              </button>
            )}
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
