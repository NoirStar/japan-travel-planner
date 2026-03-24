import { forwardRef, useState } from "react"
import {
  Plane,
  TrainFront,
  Bus,
  Hotel,
  X,
  Pencil,
  Copy,
  Check,
  Clock,
  MapPin,
  BadgeCheck,
  CircleDashed,
  ChevronDown,
  ChevronUp,
  Paperclip,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Reservation, ReservationType } from "@/types/schedule"
import { RESERVATION_LABELS } from "@/types/schedule"

interface ReservationCardProps {
  reservation: Reservation
  onEdit: () => void
  onRemove: () => void
}

const TYPE_CONFIG: Record<ReservationType, { icon: LucideIcon; gradient: string; bg: string }> = {
  flight: { icon: Plane, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  train: { icon: TrainFront, gradient: "from-teal-500 to-cyan-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
  bus: { icon: Bus, gradient: "from-orange-500 to-rose-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  accommodation: { icon: Hotel, gradient: "from-purple-500 to-fuchsia-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
}

function formatCost(cost: number): string {
  return `¥${cost.toLocaleString()}`
}

function getNightCount(date: string, endDate: string): number {
  const start = new Date(date)
  const end = new Date(endDate)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const ReservationCard = forwardRef<HTMLDivElement, ReservationCardProps>(
  function ReservationCard({ reservation, onEdit, onRemove }, ref) {
  const [expanded, setExpanded] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)

  const config = TYPE_CONFIG[reservation.type]
  const Icon = config.icon
  const isTransport = reservation.type !== "accommodation"

  const handleCopyRef = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!reservation.bookingReference) return
    await navigator.clipboard.writeText(reservation.bookingReference)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 1500)
  }

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-md ${config.bg} border-border/60`}
      data-testid={`reservation-card-${reservation.type}`}
    >
      {/* 좌측 컬러 바 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg}`} />

      {/* 액션 버튼 */}
      <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          aria-label="편집"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          aria-label="삭제"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-3 pl-4">
        {/* 메인 정보 */}
        <div className="flex items-start gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            {/* 타입 + 제목 */}
            <div className="flex items-center gap-1.5">
              <span className={`rounded-full bg-gradient-to-r ${config.gradient} px-2 py-0.5 text-[9px] font-bold text-white`}>
                {RESERVATION_LABELS[reservation.type]}
              </span>
              {reservation.confirmed ? (
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <CircleDashed className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <h3 className="mt-0.5 text-sm font-bold leading-tight">{reservation.title}</h3>

            {/* 교통: 출발/도착 */}
            {isTransport && (reservation.departureLocation || reservation.arrivalLocation) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{reservation.departureLocation ?? "—"}</span>
                <span className="text-muted-foreground/40">→</span>
                <span>{reservation.arrivalLocation ?? "—"}</span>
              </div>
            )}

            {/* 시간 */}
            {(reservation.startTime || reservation.endTime) && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {isTransport ? (
                  <>
                    <span className="font-semibold text-foreground">{reservation.startTime ?? ""}</span>
                    {reservation.endTime && (
                      <>
                        <span className="text-muted-foreground/40">→</span>
                        <span className="font-semibold text-foreground">{reservation.endTime}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>체크인 <span className="font-semibold text-foreground">{reservation.startTime ?? "—"}</span></span>
                    {reservation.endTime && (
                      <span className="ml-1">체크아웃 <span className="font-semibold text-foreground">{reservation.endTime}</span></span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 숙박: 기간 */}
            {!isTransport && reservation.endDate && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {formatShortDate(reservation.date)} ~ {formatShortDate(reservation.endDate)}
                <span className="ml-1 font-semibold text-foreground">
                  ({getNightCount(reservation.date, reservation.endDate)}박)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 확장 토글 */}
        {(reservation.bookingReference || reservation.cost || reservation.memo || reservation.provider || (reservation.attachments && reservation.attachments.length > 0)) && (
          <button
            className="mt-1.5 flex w-full items-center justify-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          >
            {expanded ? "접기" : "상세 보기"}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}

        {/* 확장 영역 */}
        {expanded && (
          <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
            {reservation.provider && (
              <div className="text-xs text-muted-foreground">
                <span className="text-muted-foreground/60">{isTransport ? "운영사" : "숙소"}</span>{" "}
                <span className="font-medium text-foreground">{reservation.provider}</span>
              </div>
            )}
            {reservation.bookingReference && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-muted-foreground/60">예약번호</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                  {reservation.bookingReference}
                </code>
                <button onClick={handleCopyRef} className="p-0.5 hover:text-foreground transition-colors" title="복사">
                  {copiedRef ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            {reservation.cost != null && reservation.cost > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="text-muted-foreground/60">비용</span>{" "}
                <span className="font-bold text-foreground">{formatCost(reservation.cost)}</span>
              </div>
            )}
            {reservation.memo && (
              <p className="rounded-lg bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">{reservation.memo}</p>
            )}
            {reservation.attachments && reservation.attachments.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground/60 text-xs">첨부파일</span>
                {reservation.attachments.map((att) => (
                  <div key={att.storagePath} className="flex items-center gap-1.5 text-xs">
                    <Paperclip className="h-3 w-3 shrink-0 text-teal-500" />
                    <span className="truncate font-medium text-foreground">{att.fileName}</span>
                    {att.size != null && (
                      <span className="shrink-0 text-muted-foreground/50">{att.size < 1024 * 1024 ? `${(att.size / 1024).toFixed(0)}KB` : `${(att.size / (1024 * 1024)).toFixed(1)}MB`}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
