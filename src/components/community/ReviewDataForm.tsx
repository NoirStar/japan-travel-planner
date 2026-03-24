import { Star, FileText, Check, X } from "lucide-react"
import type { ReviewData } from "@/types/community"
import type { Trip } from "@/types/schedule"

interface ReviewDataFormProps {
  value: ReviewData
  onChange: (data: ReviewData) => void
  trip: Trip | null
}

export function ReviewDataForm({ value, onChange, trip }: ReviewDataFormProps) {
  const update = (patch: Partial<ReviewData>) => onChange({ ...value, ...patch })

  const allPlaceIds = (trip?.days ?? []).flatMap((d) =>
    (d.items ?? []).map((item) => ({ placeId: item.placeId, placeName: item.placeName ?? item.placeId }))
  )

  const visitedSet = new Set(value.visitedPlaceIds ?? [])
  const skippedSet = new Set(value.skippedPlaceIds ?? [])

  const toggleVisited = (pid: string) => {
    const next = new Set(visitedSet)
    const skip = new Set(skippedSet)
    if (next.has(pid)) {
      next.delete(pid)
    } else {
      next.add(pid)
      skip.delete(pid)
    }
    update({ visitedPlaceIds: Array.from(next), skippedPlaceIds: Array.from(skip) })
  }

  const toggleSkipped = (pid: string) => {
    const next = new Set(skippedSet)
    const vis = new Set(visitedSet)
    if (next.has(pid)) {
      next.delete(pid)
    } else {
      next.add(pid)
      vis.delete(pid)
    }
    update({ visitedPlaceIds: Array.from(vis), skippedPlaceIds: Array.from(next) })
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
      <h4 className="mb-3 text-xs font-bold text-amber-800 dark:text-amber-300 inline-flex items-center gap-1"><FileText className="h-3 w-3" /> 후기 정보</h4>

      <div className="space-y-3">
        {/* Overall Rating */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">전체 평점</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ overallRating: value.overallRating === n ? undefined : n })}
                className="p-0.5"
              >
                <Star className={`h-5 w-5 ${(value.overallRating ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Actual Cost */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">실제 총 비용 (엔)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">¥</span>
            <input
              type="number"
              value={value.actualCost ?? ""}
              onChange={(e) => update({ actualCost: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="총 경비"
              className="h-9 w-full rounded-xl border border-border bg-background pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              min={0}
            />
          </div>
        </div>

        {/* Place status */}
        {allPlaceIds.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">장소별 방문 여부</label>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {allPlaceIds.map((p) => (
                <div key={p.placeId} className="flex items-center gap-2 rounded-lg bg-background/50 px-2.5 py-1.5">
                  <span className="flex-1 truncate text-xs">{p.placeName}</span>
                  <button
                    type="button"
                    onClick={() => toggleVisited(p.placeId)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                      visitedSet.has(p.placeId)
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-0.5">방문 <Check className="h-2.5 w-2.5" /></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSkipped(p.placeId)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                      skippedSet.has(p.placeId)
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-0.5">스킵 <X className="h-2.5 w-2.5" /></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">팁 / 메모</label>
          <textarea
            value={value.tips ?? ""}
            onChange={(e) => update({ tips: e.target.value })}
            rows={3}
            maxLength={1000}
            placeholder="여행 중 느낀 점, 추천 팁 등을 자유롭게 작성하세요"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </div>
  )
}
