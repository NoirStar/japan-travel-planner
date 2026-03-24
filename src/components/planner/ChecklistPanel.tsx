import { useState, useMemo, useEffect } from "react"
import { X, CheckSquare, Square, Plus, Trash2, RotateCcw, ChevronDown, ChevronRight, FileText, Banknote, Smartphone, Briefcase, TicketCheck, PenLine, PartyPopper, type LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useScheduleStore } from "@/stores/scheduleStore"
import {
  CHECKLIST_CATEGORY_LABELS,
  DEFAULT_CHECKLIST,
  type ChecklistCategory,
} from "@/stores/checklistStore"
import type { TripChecklistItem } from "@/types/schedule"

interface ChecklistPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
}

/** 카테고리별 아이콘/색상 */
const CATEGORY_STYLE: Record<ChecklistCategory, { icon: LucideIcon; color: string; bg: string }> = {
  documents: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  money: { icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  connectivity: { icon: Smartphone, color: "text-violet-500", bg: "bg-violet-500/10" },
  packing: { icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  bookings: { icon: TicketCheck, color: "text-rose-500", bg: "bg-rose-500/10" },
  custom: { icon: PenLine, color: "text-gray-500", bg: "bg-gray-500/10" },
}

const EMPTY_CHECKLIST: TripChecklistItem[] = []

export function ChecklistPanel({ open, onOpenChange, tripId }: ChecklistPanelProps) {
  const items = useScheduleStore((s) => s.trips.find((t) => t.id === tripId)?.checklist) ?? EMPTY_CHECKLIST
  const { initChecklist, toggleChecklistItem, addChecklistItem, removeChecklistItem, resetChecklist } = useScheduleStore()
  const [newItemText, setNewItemText] = useState("")
  const [newItemCategory, setNewItemCategory] = useState<ChecklistCategory>("custom")
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (open && items.length === 0) {
      initChecklist(tripId, DEFAULT_CHECKLIST)
    }
  }, [open, items.length, tripId, initChecklist])

  // 카테고리별 그룹화
  const grouped = useMemo(() => {
    const map = new Map<ChecklistCategory, typeof items>()
    for (const item of items) {
      const cat = item.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return map
  }, [items])

  // 진행률
  const checkedCount = items.filter((i) => i.checked).length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const handleAddItem = () => {
    const text = newItemText.trim()
    if (!text) return
    addChecklistItem(tripId, text, newItemCategory)
    setNewItemText("")
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (!open) return null

  // 카테고리 렌더링 순서
  const categoryOrder: ChecklistCategory[] = ["documents", "money", "connectivity", "packing", "bookings", "custom"]

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        data-testid="checklist-backdrop"
      />

      {/* 시트 패널 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-card shadow-xl border-t border-border lg:left-0 lg:max-h-full lg:w-[400px] lg:rounded-none lg:rounded-tr-2xl"
        data-testid="checklist-panel"
      >
        {/* 핸들 + 헤더 */}
        <div className="flex flex-col items-center border-b border-border px-3 pb-2 pt-2">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-border/80 lg:hidden" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <h3 className="text-sm font-bold">준비물 체크리스트</h3>
            </div>
            <div className="flex items-center gap-1">
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  title="초기화"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={() => { resetChecklist(tripId, DEFAULT_CHECKLIST); setShowResetConfirm(false) }}
                    className="rounded-lg bg-destructive px-2 py-1 font-bold text-white"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted"
                  >
                    취소
                  </button>
                </div>
              )}
              <button
                onClick={() => onOpenChange(false)}
                aria-label="닫기"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="border-b border-border px-4 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">준비 진행률</span>
            <span className="font-bold text-foreground">{checkedCount}/{totalCount} ({progress}%)</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sakura-dark to-pink-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="mt-1 text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 justify-center w-full">
              <PartyPopper className="h-3.5 w-3.5" /> 모든 준비가 완료되었습니다!
            </p>
          )}
        </div>

        {/* 체크리스트 */}
        <div className="flex-1 overflow-y-auto px-3 py-2" data-testid="checklist-items">
          {categoryOrder.map((category) => {
            const categoryItems = grouped.get(category)
            if (!categoryItems || categoryItems.length === 0) return null
            const style = CATEGORY_STYLE[category]
            const isCollapsed = collapsedCategories.has(category)
            const catChecked = categoryItems.filter((i) => i.checked).length
            const allChecked = catChecked === categoryItems.length

            return (
              <div key={category} className="mb-2">
                {/* 카테고리 헤더 */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-muted/50 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md ${style.bg}`}>
                    <style.icon className={`h-3 w-3 ${style.color}`} />
                  </span>
                  <span>{CHECKLIST_CATEGORY_LABELS[category]}</span>
                  <span className={`ml-auto text-[10px] font-medium ${allChecked ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {catChecked}/{categoryItems.length}
                  </span>
                </button>

                {/* 아이템 목록 */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5 pl-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors"
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <button
                          onClick={() => toggleChecklistItem(tripId, item.id)}
                          className="shrink-0"
                          aria-label={item.checked ? "체크 해제" : "체크"}
                        >
                          {item.checked ? (
                            <CheckSquare className="h-4 w-4 text-sakura-dark" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </button>
                        <span className={`flex-1 text-[12px] leading-snug ${
                          item.checked ? "text-muted-foreground line-through" : "text-foreground"
                        }`}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => removeChecklistItem(tripId, item.id)}
                          className="shrink-0 rounded-full p-0.5 text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          aria-label="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 아이템 추가 (카테고리 선택 가능) */}
        <div className="border-t border-border px-3 py-2.5">
          <div className="flex gap-2">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as ChecklistCategory)}
              className="h-8 w-20 shrink-0 rounded-xl border border-border bg-background px-1.5 text-[11px] font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            >
              {categoryOrder.map((cat) => (
                <option key={cat} value={cat}>{CHECKLIST_CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddItem() }}
              placeholder="준비물 직접 추가..."
              className="h-8 flex-1 rounded-xl border-border text-sm"
              data-testid="checklist-add-input"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="btn-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-0 text-white shadow-sm disabled:opacity-40"
              data-testid="checklist-add-button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
