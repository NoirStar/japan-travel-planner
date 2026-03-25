import { useState } from "react"
import {
  X,
  Plane,
  TrainFront,
  Bus,
  Hotel,
  BadgeCheck,
  CircleDashed,
  Paperclip,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Reservation, ReservationType, ReservationAttachment } from "@/types/schedule"
import { ReservationType as RT, RESERVATION_LABELS } from "@/types/schedule"

interface ReservationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 편집 시 기존 예약 데이터 */
  editData?: Reservation | null
  /** 현재 Day의 날짜 (기본값으로 사용) */
  defaultDate?: string
  onSubmit: (data: Omit<Reservation, "id">) => void
}

interface TypeOption {
  value: ReservationType
  icon: LucideIcon
  gradient: string
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: RT.FLIGHT, icon: Plane, gradient: "from-indigo to-indigo-light" },
  { value: RT.TRAIN, icon: TrainFront, gradient: "from-indigo-light to-indigo" },
  { value: RT.BUS, icon: Bus, gradient: "from-primary/80 to-primary" },
  { value: RT.ACCOMMODATION, icon: Hotel, gradient: "from-sakura to-primary" },
]

const TITLE_PLACEHOLDERS: Record<ReservationType, string> = {
  flight: "ANA NH862, 대한항공 KE711...",
  train: "신칸센 노조미 23호, 하루카 특급...",
  bus: "리무진 버스, 고속버스...",
  accommodation: "호텔 그레이서리 신주쿠, 에어비앤비...",
}

function getInitialForm(editData?: Reservation | null, defaultDate?: string): Omit<Reservation, "id"> {
  if (editData) {
    const { id: _id, ...rest } = editData
    return rest
  }
  return {
    type: RT.FLIGHT,
    title: "",
    date: defaultDate ?? "",
    startTime: "",
    endTime: "",
    departureLocation: "",
    arrivalLocation: "",
    bookingReference: "",
    provider: "",
    cost: undefined,
    memo: "",
    confirmed: false,
    attachments: [],
  }
}

export function ReservationSheet({ open, onOpenChange, editData, defaultDate, onSubmit }: ReservationSheetProps) {
  const [form, setForm] = useState(() => getInitialForm(editData, defaultDate))
  const [step, setStep] = useState<"type" | "detail">(editData ? "detail" : "type")
  const [prevOpen, setPrevOpen] = useState(open)

  // open 전환 시 동기적으로 폼 리셋 (useEffect 대신 — 0.1초 깜빡임 방지)
  if (open && !prevOpen) {
    setPrevOpen(true)
    setForm(getInitialForm(editData, defaultDate))
    setStep(editData ? "detail" : "type")
  } else if (!open && prevOpen) {
    setPrevOpen(false)
  }

  const isTransport = form.type !== "accommodation"
  const isValid = form.title.trim() && form.date

  const handleTypeSelect = (type: ReservationType) => {
    setForm((prev) => ({ ...prev, type }))
    setStep("detail")
  }

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({
      ...form,
      title: form.title.trim(),
      cost: form.cost ? Number(form.cost) : undefined,
    })
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        data-testid="reservation-sheet-backdrop"
      />

      {/* 시트 패널 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-card shadow-xl border-t border-border lg:left-0 lg:max-h-full lg:w-[400px] lg:rounded-none lg:rounded-tr-2xl"
        data-testid="reservation-sheet"
      >
        {/* 핸들 + 헤더 */}
        <div className="flex flex-col items-center border-b border-border px-4 pb-3 pt-2">
          <div className="mb-2 h-1 w-10 rounded-full bg-border/80 lg:hidden" />
          <div className="flex w-full items-center justify-between">
            <h3 className="text-sm font-bold">
              {editData ? "예약 수정" : step === "type" ? "예약 추가" : `${RESERVATION_LABELS[form.type]} 추가`}
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="닫기"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === "type" ? (
            /* ── 타입 선택 ── */
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">어떤 예약을 추가할까요?</p>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleTypeSelect(opt.value)}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-border p-5 transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.97]"
                      data-testid={`reservation-type-${opt.value}`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${opt.gradient}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-bold">{RESERVATION_LABELS[opt.value]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* ── 상세 입력 폼 ── */
            <div className="space-y-4">
              {/* 타입 변경 (편집이 아닐 때만) */}
              {!editData && (
                <div className="flex gap-1.5">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = form.type === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setForm((prev) => ({ ...prev, type: opt.value }))}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                          active
                            ? `bg-gradient-to-r ${opt.gradient} text-white shadow-sm`
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {RESERVATION_LABELS[opt.value]}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 이름 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {isTransport ? "편명 / 열차명" : "숙소명"} <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={TITLE_PLACEHOLDERS[form.type]}
                  className="h-9 rounded-xl text-sm"
                  maxLength={80}
                  autoFocus
                  data-testid="reservation-title-input"
                />
              </div>

              {/* 교통: 출발/도착지 */}
              {isTransport && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">출발지</label>
                    <Input
                      value={form.departureLocation ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, departureLocation: e.target.value }))}
                      placeholder="인천공항, 도쿄역..."
                      className="h-9 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">도착지</label>
                    <Input
                      value={form.arrivalLocation ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, arrivalLocation: e.target.value }))}
                      placeholder="나리타공항, 오사카역..."
                      className="h-9 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {/* 날짜 */}
              <div className={isTransport ? "" : "grid grid-cols-2 gap-2"}>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {isTransport ? "날짜" : "체크인 날짜"} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    data-testid="reservation-date-input"
                  />
                </div>
                {!isTransport && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">체크아웃 날짜</label>
                    <input
                      type="date"
                      value={form.endDate ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}
              </div>

              {/* 시간 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {isTransport ? "출발 시간" : "체크인 시간"}
                  </label>
                  <input
                    type="time"
                    value={form.startTime ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {isTransport ? "도착 시간" : "체크아웃 시간"}
                  </label>
                  <input
                    type="time"
                    value={form.endTime ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* 운영사 / 예약번호 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {isTransport ? "운영사" : "숙소명/브랜드"}
                  </label>
                  <Input
                    value={form.provider ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                    placeholder={isTransport ? "ANA, JR West..." : "힐튼, Airbnb..."}
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">예약번호</label>
                  <Input
                    value={form.bookingReference ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, bookingReference: e.target.value }))}
                    placeholder="ABC123"
                    className="h-9 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* 비용 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">비용 (엔)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">¥</span>
                  <Input
                    type="number"
                    value={form.cost ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="45,000"
                    className="h-9 rounded-xl pl-7 text-sm"
                    min={0}
                  />
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">메모</label>
                <textarea
                  value={form.memo ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                  placeholder="터미널 2, 좌석 12A, 조식 포함..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* 첨부파일 연결 */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Paperclip className="h-3 w-3" /> 첨부파일
                </label>
                {(form.attachments ?? []).length > 0 && (
                  <div className="mb-2 space-y-1">
                    {form.attachments!.map((att, idx) => (
                      <div key={att.storagePath} className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1 text-xs">
                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            attachments: prev.attachments?.filter((_, i) => i !== idx),
                          }))}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <Paperclip className="h-3 w-3" />
                  파일 첨부
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const att: ReservationAttachment = {
                        storagePath: `local/${Date.now()}_${file.name}`,
                        fileName: file.name,
                        size: file.size,
                        addedAt: new Date().toISOString(),
                      }
                      setForm((prev) => ({
                        ...prev,
                        attachments: [...(prev.attachments ?? []), att],
                      }))
                      e.target.value = ""
                    }}
                  />
                </label>
              </div>

              {/* 예약 확정 토글 */}
              <button
                onClick={() => setForm((prev) => ({ ...prev, confirmed: !prev.confirmed }))}
                className={`flex w-full items-center gap-2 rounded-xl border p-3 transition-all ${
                  form.confirmed
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-muted/30"
                }`}
                data-testid="reservation-confirmed-toggle"
              >
                {form.confirmed ? (
                  <BadgeCheck className="h-5 w-5 text-success" />
                ) : (
                  <CircleDashed className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="text-left">
                  <span className="text-sm font-semibold">{form.confirmed ? "예약 확정" : "미확정"}</span>
                  <p className="text-[10px] text-muted-foreground">
                    {form.confirmed ? "예약이 완료된 항목입니다" : "아직 예약하지 않은 항목입니다"}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {step === "detail" && (
          <div className="flex gap-2 border-t border-border p-4">
            {!editData && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setStep("type")}
              >
                이전
              </Button>
            )}
            <Button
              className="btn-gradient flex-1 rounded-xl font-bold"
              disabled={!isValid}
              onClick={handleSubmit}
              data-testid="reservation-submit"
            >
              {editData ? "수정 완료" : "추가하기"}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
