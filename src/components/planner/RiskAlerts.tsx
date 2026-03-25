import { useState } from "react"
import { AlertTriangle, Info, ChevronDown, ChevronUp, Shield } from "lucide-react"
import type { ScheduleRisk } from "@/hooks/useScheduleRisks"

interface RiskAlertsProps {
  risks: ScheduleRisk[]
  /** 현재 보고 있는 Day만 필터 (undefined이면 전체) */
  currentDayNumber?: number
}

export function RiskAlerts({ risks, currentDayNumber }: RiskAlertsProps) {
  const [expanded, setExpanded] = useState(false)

  // 현재 Day에 해당하는 리스크만 필터
  const filtered = currentDayNumber
    ? risks.filter((r) => r.dayNumber === currentDayNumber)
    : risks

  if (filtered.length === 0) return null

  const warnings = filtered.filter((r) => r.level === "warning")
  const infos = filtered.filter((r) => r.level === "info")

  return (
    <div className="border-t border-border bg-card" data-testid="risk-alerts">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-warning" />
          <span className="font-semibold text-foreground">일정 점검</span>
          {warnings.length > 0 && (
            <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
              {warnings.length}
            </span>
          )}
          {infos.length > 0 && (
            <span className="rounded-full bg-indigo/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo">
              {infos.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="flex flex-col gap-1 px-4 pb-2.5" data-testid="risk-alerts-list">
          {filtered.map((risk) => (
            <div
              key={risk.id}
              className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                risk.level === "warning"
                  ? "bg-warning/10 text-warning"
                  : "bg-indigo/10 text-indigo"
              }`}
              data-testid={`risk-${risk.id}`}
            >
              {risk.level === "warning" ? (
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              ) : (
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
              )}
              <span className="leading-relaxed">{risk.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
