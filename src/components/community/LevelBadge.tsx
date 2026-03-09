import { getLevelInfo } from "@/types/community"
import { LEVEL_ICONS } from "./levelIconMap"
import { AdminShieldIcon } from "./LevelIcons"

interface LevelBadgeProps {
  level: number
  totalLikes?: number
  totalPoints?: number
  isAdmin?: boolean
  compact?: boolean
}

const LEVEL_COLORS: Record<number, string> = {
  1:  "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40",
  2:  "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/40",
  3:  "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40",
  4:  "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/40",
  5:  "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/40",
  6:  "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40",
  7:  "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/40",
  8:  "border-cyan-400 bg-cyan-50 dark:border-cyan-600 dark:bg-cyan-950/40",
  9:  "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/40",
  10: "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/40",
  11: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40",
  12: "border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/40",
  13: "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-950/40",
  14: "border-gray-500 bg-gray-50 dark:border-gray-400 dark:bg-gray-950/40",
  15: "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:border-emerald-500 dark:from-emerald-950/40 dark:to-green-950/40",
  16: "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-500 dark:from-blue-950/40 dark:to-indigo-950/40",
  17: "border-indigo-400 bg-gradient-to-r from-indigo-50 to-emerald-50 dark:border-indigo-500 dark:from-indigo-950/40 dark:to-emerald-950/40",
  18: "border-yellow-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-yellow-500 dark:from-amber-950/40 dark:to-yellow-950/40",
  19: "border-violet-400 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:border-violet-500 dark:from-violet-950/40 dark:to-fuchsia-950/40",
  20: "border-amber-500 bg-gradient-to-r from-amber-50 via-red-50 to-amber-50 dark:border-amber-400 dark:from-amber-950/40 dark:via-red-950/40 dark:to-amber-950/40",
}

export function LevelBadge({ level, totalPoints, isAdmin, compact }: LevelBadgeProps) {
  if (isAdmin) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-xs" title="관리자">
          <AdminShieldIcon size={14} />
          <span className="font-bold text-amber-500">관리자</span>
        </span>
      )
    }
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-gradient-to-r from-amber-50 to-red-50 px-3 py-1 text-sm dark:border-amber-500 dark:from-amber-950/40 dark:to-red-950/40">
        <AdminShieldIcon size={20} />
        <span className="font-bold text-amber-600 dark:text-amber-400">관리자</span>
      </div>
    )
  }

  const info = getLevelInfo(typeof level === "number" ? level : 1)
  const icon = LEVEL_ICONS[info.level] ?? LEVEL_ICONS[1]
  const pts = typeof totalPoints === "number" ? totalPoints : 0

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs" title={`Lv.${info.level} ${info.label} (${pts}P)`}>
        {icon(14)}
        <span className="font-medium text-muted-foreground">{info.label}</span>
      </span>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${LEVEL_COLORS[info.level] ?? ""}`}>
      {icon(20)}
      <span className="font-semibold">Lv.{info.level}</span>
      <span className="text-muted-foreground">{info.label}</span>
      <span className="text-xs text-muted-foreground">· {pts}P</span>
    </div>
  )
}
