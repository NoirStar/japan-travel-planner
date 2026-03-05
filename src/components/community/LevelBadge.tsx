import { getLevelInfo } from "@/types/community"

interface LevelBadgeProps {
  level: number
  totalLikes: number
  compact?: boolean
}

export function LevelBadge({ level, totalLikes, compact }: LevelBadgeProps) {
  const info = getLevelInfo(level)

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs" title={`Lv.${info.level} ${info.label} (추천 ${totalLikes}개)`}>
        <span>{info.emoji}</span>
        <span className="font-medium text-muted-foreground">{info.label}</span>
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm">
      <span className="text-base">{info.emoji}</span>
      <span className="font-semibold">Lv.{info.level}</span>
      <span className="text-muted-foreground">{info.label}</span>
      <span className="text-xs text-muted-foreground">· 추천 {totalLikes}</span>
    </div>
  )
}
