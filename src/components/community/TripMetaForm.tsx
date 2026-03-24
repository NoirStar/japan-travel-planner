import { useState } from "react"
import type { TripMeta, CompanionType, BudgetBand, IntensityLevel } from "@/types/community"
import { COMPANION_LABELS, BUDGET_LABELS, INTENSITY_LABELS } from "@/types/community"

interface TripMetaFormProps {
  value: TripMeta
  onChange: (meta: TripMeta) => void
}

const MONTHS = [
  { value: 1, label: "1월" }, { value: 2, label: "2월" }, { value: 3, label: "3월" },
  { value: 4, label: "4월" }, { value: 5, label: "5월" }, { value: 6, label: "6월" },
  { value: 7, label: "7월" }, { value: 8, label: "8월" }, { value: 9, label: "9월" },
  { value: 10, label: "10월" }, { value: 11, label: "11월" }, { value: 12, label: "12월" },
]

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Record<T, string>
  value: T | undefined
  onChange: (v: T | undefined) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(options) as [T, string][]).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(value === k ? undefined : k)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              value === k
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

function FocusSlider({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  const v = value ?? 3
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label} <span className="text-primary font-bold">{v}/5</span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1.5"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-0.5">
        <span>낮음</span><span>높음</span>
      </div>
    </div>
  )
}

export function TripMetaForm({ value, onChange }: TripMetaFormProps) {
  const [expanded, setExpanded] = useState(false)

  const update = (patch: Partial<TripMeta>) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-xl border border-border p-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-xs font-semibold text-foreground"
      >
        <span>🏷️ 여행 메타 정보 (선택)</span>
        <span className="text-muted-foreground">{expanded ? "접기" : "펼치기"}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          <ChipGroup
            label="동행 유형"
            options={COMPANION_LABELS}
            value={value.companionType}
            onChange={(v) => update({ companionType: v })}
          />
          <ChipGroup
            label="예산 수준"
            options={BUDGET_LABELS}
            value={value.budgetBand}
            onChange={(v) => update({ budgetBand: v })}
          />
          <ChipGroup
            label="걷기 강도"
            options={INTENSITY_LABELS}
            value={value.walkingIntensity}
            onChange={(v) => update({ walkingIntensity: v })}
          />
          <ChipGroup
            label="체력 수준"
            options={INTENSITY_LABELS}
            value={value.staminaLevel}
            onChange={(v) => update({ staminaLevel: v })}
          />
          <FocusSlider label="맛집 중시도" value={value.foodFocus} onChange={(v) => update({ foodFocus: v })} />
          <FocusSlider label="쇼핑 중시도" value={value.shoppingFocus} onChange={(v) => update({ shoppingFocus: v })} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">방문 월</label>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => update({ visitMonth: null })}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                  !value.visitMonth ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                미정
              </button>
              {MONTHS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => update({ visitMonth: value.visitMonth === m.value ? null : m.value })}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    value.visitMonth === m.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
