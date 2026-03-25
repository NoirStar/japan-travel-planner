import { getLevelInfo } from "@/types/community"
import { LEVEL_ICONS } from "./levelIconMap"

interface LevelBadgeProps {
  level: number
  totalLikes?: number
  totalPoints?: number
  isAdmin?: boolean
  compact?: boolean
}

/* 5 tiers: 브랜드 팔레트 기반 레벨 그룹
   Tier 1 (Lv.1-4):  muted/subtle — 시작 단계
   Tier 2 (Lv.5-8):  indigo 계열 — 중급 여행자
   Tier 3 (Lv.9-12): primary 계열 — 숙련 여행자
   Tier 4 (Lv.13-16): warm amber — 고급 여행자
   Tier 5 (Lv.17-20): rich gold — 전설 등급 */
function getLevelTier(level: number): { badge: string; compact: string } {
  if (level <= 4) return {
    badge: "border-border bg-muted dark:border-border dark:bg-muted",
    compact: "text-muted-foreground",
  }
  if (level <= 8) return {
    badge: "border-indigo/30 bg-indigo/5 dark:border-indigo/40 dark:bg-indigo/10",
    compact: "text-indigo dark:text-indigo-light font-semibold",
  }
  if (level <= 12) return {
    badge: "border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10",
    compact: "text-primary font-bold",
  }
  if (level <= 16) return {
    badge: "border-warning/30 bg-warning/5",
    compact: "text-warning font-bold",
  }
  return {
    badge: "border-warning/50 bg-gradient-to-r from-warning/5 to-primary/5",
    compact: "text-warning font-extrabold",
  }
}

export function LevelBadge({ level, totalPoints, isAdmin, compact }: LevelBadgeProps) {
  if (isAdmin) {
    if (compact) {
      return (
        <span className="text-[11px] font-bold text-warning" title="관리자">관리자</span>
      )
    }
    return (
      <span className="text-sm font-bold text-warning">관리자</span>
    )
  }

  const info = getLevelInfo(typeof level === "number" ? level : 1)
  const icon = LEVEL_ICONS[info.level] ?? LEVEL_ICONS[1]
  const pts = typeof totalPoints === "number" ? totalPoints : 0
  const tier = getLevelTier(info.level)

  if (compact) {
    return (
      <span
        className={`inline-flex items-center text-[11px] ${tier.compact}`}
        title={`Lv.${info.level} ${info.label} (${pts}P)`}
      >
        Lv.{info.level}
      </span>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${tier.badge}`}>
      {icon(20)}
      <span className="font-semibold">Lv.{info.level}</span>
      <span className="text-muted-foreground">{info.label}</span>
      <span className="text-xs text-muted-foreground">· {pts}P</span>
    </div>
  )
}
