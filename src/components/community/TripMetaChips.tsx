import type React from "react"
import { DollarSign, Footprints, UtensilsCrossed, ShoppingBag } from "lucide-react"
import type { TripMeta } from "@/types/community"
import { COMPANION_LABELS, BUDGET_LABELS, INTENSITY_LABELS } from "@/types/community"

interface TripMetaChipsProps {
  meta: TripMeta | null | undefined
  compact?: boolean
}

export function TripMetaChips({ meta, compact }: TripMetaChipsProps) {
  if (!meta) return null

  /* 브랜드 팔레트 기반 3톤 칩 시스템:
     - warm: 동행/예산 등 일반 정보 → primary 계열
     - cool: 활동 강도/시기 → indigo 계열
     - accent: 맛집/쇼핑 등 관심사 → muted 계열 + primary 텍스트 */
  const warm = "bg-primary/8 text-primary dark:bg-primary/15 dark:text-primary"
  const cool = "bg-indigo/8 text-indigo dark:bg-indigo/15 dark:text-indigo-light"
  const accent = "bg-muted text-foreground dark:bg-muted dark:text-foreground"

  const chips: { label: string; icon?: React.ReactNode; color: string }[] = []

  if (meta.companionType) chips.push({ label: COMPANION_LABELS[meta.companionType], color: warm })
  if (meta.budgetBand) chips.push({ label: BUDGET_LABELS[meta.budgetBand], icon: <DollarSign className="h-2.5 w-2.5" />, color: warm })
  if (meta.walkingIntensity) chips.push({ label: INTENSITY_LABELS[meta.walkingIntensity], icon: <Footprints className="h-2.5 w-2.5" />, color: cool })
  if (meta.foodFocus && meta.foodFocus >= 4) chips.push({ label: "맛집", icon: <UtensilsCrossed className="h-2.5 w-2.5" />, color: accent })
  if (meta.shoppingFocus && meta.shoppingFocus >= 4) chips.push({ label: "쇼핑", icon: <ShoppingBag className="h-2.5 w-2.5" />, color: accent })
  if (meta.visitMonth) chips.push({ label: `${meta.visitMonth}월`, color: cool })

  if (chips.length === 0) return null

  const displayed = compact ? chips.slice(0, 3) : chips

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((c, i) => (
        <span key={i} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.color}`}>
          {c.icon}{c.label}
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
