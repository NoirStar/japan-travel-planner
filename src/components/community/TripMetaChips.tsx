import type { TripMeta } from "@/types/community"
import { COMPANION_LABELS, BUDGET_LABELS, INTENSITY_LABELS } from "@/types/community"

interface TripMetaChipsProps {
  meta: TripMeta | null | undefined
  compact?: boolean
}

export function TripMetaChips({ meta, compact }: TripMetaChipsProps) {
  if (!meta) return null

  const chips: { label: string; color: string }[] = []

  if (meta.companionType) chips.push({ label: COMPANION_LABELS[meta.companionType], color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" })
  if (meta.budgetBand) chips.push({ label: `💰 ${BUDGET_LABELS[meta.budgetBand]}`, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" })
  if (meta.walkingIntensity) chips.push({ label: `🚶 ${INTENSITY_LABELS[meta.walkingIntensity]}`, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" })
  if (meta.foodFocus && meta.foodFocus >= 4) chips.push({ label: "🍜 맛집", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" })
  if (meta.shoppingFocus && meta.shoppingFocus >= 4) chips.push({ label: "🛍️ 쇼핑", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" })
  if (meta.visitMonth) chips.push({ label: `${meta.visitMonth}월`, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" })

  if (chips.length === 0) return null

  const displayed = compact ? chips.slice(0, 3) : chips

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((c, i) => (
        <span key={i} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.color}`}>
          {c.label}
        </span>
      ))}
      {compact && chips.length > 3 && (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          +{chips.length - 3}
        </span>
      )}
    </div>
  )
}
