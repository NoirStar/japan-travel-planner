import { useState, useEffect, useCallback, useRef } from "react"
import { Paperclip, Upload, Trash2, FileText, Image, Download, X } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
}

interface Attachment {
  name: string
  fullPath: string
  size: number
  createdAt: string
  url: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return <FileText className="h-5 w-5 text-red-500" />
  return <Image className="h-5 w-5 text-blue-500" />
}

export function AttachmentVault({ open, onOpenChange, tripId }: Props) {
  const { user } = useAuthStore()
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const basePath = user ? `${user.id}/${tripId}` : null

  const fetchFiles = useCallback(async () => {
    if (!basePath || !isSupabaseConfigured) return
    const { data, error: err } = await supabase.storage
      .from("trip-attachments")
      .list(basePath, { sortBy: { column: "created_at", order: "desc" } })

    if (err || !data) return

    const items: Attachment[] = data
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const { data: urlData } = supabase.storage
          .from("trip-attachments")
          .createSignedUrl(`${basePath}/${f.name}`, 3600)
        return {
          name: f.name,
          fullPath: `${basePath}/${f.name}`,
          size: f.metadata?.size ?? 0,
          createdAt: f.created_at ?? "",
          url: (urlData as { signedUrl?: string } | null)?.signedUrl ?? "",
        }
      })
    setFiles(items)
  }, [basePath])

  useEffect(() => {
    if (open) fetchFiles()
  }, [open, fetchFiles])

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !basePath) return
    setError(null)

    const file = fileList[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WebP, PDF만 업로드할 수 있습니다")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기는 10MB 이하여야 합니다")
      return
    }

    setUploading(true)
    try {
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      const { error: err } = await supabase.storage
        .from("trip-attachments")
        .upload(`${basePath}/${safeName}`, file)

      if (err) {
        setError(err.message)
      } else {
        await fetchFiles()
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (fullPath: string) => {
    const { error: err } = await supabase.storage
      .from("trip-attachments")
      .remove([fullPath])

    if (!err) {
      setFiles((prev) => prev.filter((f) => f.fullPath !== fullPath))
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-full flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">첨부 보관함</h3>
            <span className="text-[10px] text-muted-foreground">{files.length}개</span>
          </div>
          <button
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 업로드 영역 */}
        <div className="border-b border-border px-4 py-3">
          {!user ? (
            <p className="text-xs text-muted-foreground text-center py-2">로그인 후 파일을 업로드할 수 있습니다</p>
          ) : !isSupabaseConfigured ? (
            <p className="text-xs text-muted-foreground text-center py-2">Supabase 설정이 필요합니다</p>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "업로드 중..." : "파일 추가 (JPG, PNG, PDF)"}
              </button>
              {error && <p className="mt-1.5 text-[11px] text-destructive">{error}</p>}
            </>
          )}
        </div>

        {/* 파일 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {files.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              e-ticket, 호텔 바우처, QR 코드 등을<br />여행별로 보관할 수 있습니다
            </p>
          )}

          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.fullPath} className="flex items-center gap-3 rounded-xl border border-border p-3">
                {getIcon(f.name)}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{f.name.replace(/^\d+_/, "")}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(f.size)}</p>
                </div>
                <div className="flex gap-1">
                  {f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => handleDelete(f.fullPath)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
