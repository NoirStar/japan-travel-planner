import { useState, useEffect, useCallback } from "react"
import { History, RefreshCw, User } from "lucide-react"
import { getTripChanges, type TripChange } from "@/services/tripSyncService"

interface Props {
  open: boolean
  onClose: () => void
  sharedId: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "방금 전"
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export function ChangeHistoryPanel({ open, onClose, sharedId }: Props) {
  const [changes, setChanges] = useState<TripChange[]>([])
  const [loading, setLoading] = useState(false)

  const fetchChanges = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTripChanges(sharedId)
      setChanges(data)
    } finally {
      setLoading(false)
    }
  }, [sharedId])

  useEffect(() => {
    if (open) fetchChanges()
  }, [open, fetchChanges])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-full flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">변경 이력</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              onClick={fetchChanges}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {changes.length === 0 && !loading && (
            <p className="py-8 text-center text-xs text-muted-foreground">변경 이력이 없습니다</p>
          )}

          <div className="space-y-3">
            {changes.map((c) => (
              <div key={c.id} className="flex gap-3">
                {/* 아바타 */}
                <div className="flex shrink-0 items-start pt-0.5">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* 내용 */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-semibold text-foreground">{c.nickname}</span>
                    <span className="ml-1.5 text-muted-foreground">{c.summary}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    v{c.version} · {timeAgo(c.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
