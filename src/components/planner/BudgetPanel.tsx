import { useMemo, useState } from "react"
import { X, Wallet, TrendingUp, PieChart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useScheduleStore } from "@/stores/scheduleStore"
import { COST_CATEGORY_LABELS, type CostCategory } from "@/types/schedule"

interface BudgetPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
}

const COST_CATEGORY_COLORS: Record<CostCategory, string> = {
  food: "#f97316",
  transport: "#10b981",
  ticket: "#ec4899",
  shopping: "#8b5cf6",
  accommodation: "#3b82f6",
  other: "#6b7280",
}

export function BudgetPanel({ open, onOpenChange, tripId }: BudgetPanelProps) {
  const trip = useScheduleStore((s) => s.trips.find((t) => t.id === tripId))
  const updateTrip = useScheduleStore((s) => s.updateTrip)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState("")

  const budget = trip?.budget ?? 0

  // 모든 아이템의 비용 합계 + 카테고리별
  const { totalCost, byCategoryList, reservationCost } = useMemo(() => {
    if (!trip) return { totalCost: 0, byCategoryList: [], reservationCost: 0 }

    const byCategory = new Map<CostCategory, number>()
    let total = 0

    for (const day of trip.days) {
      for (const item of day.items) {
        if (item.cost && item.cost > 0) {
          total += item.cost
          const cat = item.costCategory ?? "other"
          byCategory.set(cat, (byCategory.get(cat) ?? 0) + item.cost)
        }
      }
    }

    let rsvCost = 0
    for (const rsv of trip.reservations ?? []) {
      if (rsv.cost && rsv.cost > 0) {
        rsvCost += rsv.cost
      }
    }
    total += rsvCost

    const list = [...byCategory.entries()]
      .map(([cat, amount]) => ({ cat, amount, label: COST_CATEGORY_LABELS[cat], color: COST_CATEGORY_COLORS[cat] }))
      .sort((a, b) => b.amount - a.amount)

    return { totalCost: total, byCategoryList: list, reservationCost: rsvCost }
  }, [trip])

  const remaining = budget - totalCost
  const usagePercent = budget > 0 ? Math.min(Math.round((totalCost / budget) * 100), 100) : 0

  const handleSaveBudget = () => {
    const val = parseInt(budgetInput, 10)
    if (!Number.isNaN(val) && val >= 0) {
      updateTrip(tripId, { budget: val })
    }
    setEditingBudget(false)
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-card shadow-xl border-t border-border lg:left-0 lg:max-h-full lg:w-[400px] lg:rounded-none lg:rounded-tr-2xl">
        {/* 헤더 */}
        <div className="flex flex-col items-center border-b border-border px-3 pb-2 pt-2">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-border/80 lg:hidden" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-success" />
              <h3 className="text-sm font-bold">여행 예산</h3>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="닫기"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 예산 설정 */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">총 예산</span>
            {editingBudget ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveBudget() }}
                  className="h-6 w-28 text-right text-xs"
                  autoFocus
                  min={0}
                />
                <span className="text-[10px] text-muted-foreground">¥</span>
                <button
                  onClick={handleSaveBudget}
                  className="rounded bg-cyan px-2 py-0.5 text-[10px] font-bold text-primary-foreground"
                >
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setBudgetInput(String(budget)); setEditingBudget(true) }}
                className="font-bold text-foreground hover:text-cyan transition-colors"
              >
                {budget > 0 ? `¥${budget.toLocaleString()}` : "설정하기"}
              </button>
            )}
          </div>

          {/* 사용량 바 */}
          {budget > 0 && (
            <>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remaining < 0 ? "bg-destructive" : remaining < budget * 0.2 ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px]">
                <span className="text-muted-foreground">사용 ¥{totalCost.toLocaleString()}</span>
                <span className={remaining < 0 ? "font-bold text-destructive" : "text-muted-foreground"}>
                  {remaining >= 0 ? `남은 금액 ¥${remaining.toLocaleString()}` : `초과 ¥${Math.abs(remaining).toLocaleString()}`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 카테고리별 지출 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <PieChart className="h-3.5 w-3.5" />
            카테고리별 지출
          </div>

          {byCategoryList.length === 0 && reservationCost === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                일정 아이템의 비용을 입력하면<br />카테고리별 지출을 확인할 수 있습니다
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {byCategoryList.map(({ cat, amount, label, color }) => (
                <div key={cat} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/30">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="flex-1 text-[12px]">{label}</span>
                  <span className="text-[12px] font-semibold">¥{amount.toLocaleString()}</span>
                  {budget > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round((amount / budget) * 100)}%
                    </span>
                  )}
                </div>
              ))}
              {reservationCost > 0 && (
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/30">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo" />
                  <span className="flex-1 text-[12px]">예약 비용</span>
                  <span className="text-[12px] font-semibold">¥{reservationCost.toLocaleString()}</span>
                  {budget > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round((reservationCost / budget) * 100)}%
                    </span>
                  )}
                </div>
              )}
              <div className="mt-1 border-t border-border pt-1.5 flex items-center justify-between">
                <span className="text-[12px] font-bold">합계</span>
                <span className="text-[12px] font-bold">¥{totalCost.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
