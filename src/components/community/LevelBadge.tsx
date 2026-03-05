import { getLevelInfo } from "@/types/community"

interface LevelBadgeProps {
  level: number
  totalLikes: number
  compact?: boolean
}

/* ── 레벨별 애니메이션 SVG 아이콘 ───────────────────── */
function SproutIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-sprout drop-shadow-sm">
      <path d="M12 22V12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12C12 8 8 6 4 6c0 4 2 6 8 6" fill="#4ade80" opacity="0.8" />
      <path d="M12 12C12 8 16 6 20 6c0 4-2 6-8 6" fill="#22c55e" opacity="0.9" />
    </svg>
  )
}

function SakuraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-sakura-spin drop-shadow-sm">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="12" cy="6" rx="3" ry="5"
          fill="#f9a8d4"
          transform={`rotate(${deg} 12 12)`}
          opacity="0.85"
        />
      ))}
      <circle cx="12" cy="12" r="2.5" fill="#fbbf24" />
    </svg>
  )
}

function StarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-sparkle drop-shadow-md">
      <defs>
        <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l2.9 5.9L21 9.2l-4.5 4.4 1.1 6.3L12 17l-5.6 2.9 1.1-6.3L3 9.2l6.1-1.3z"
        fill="url(#star-grad)"
        stroke="#f59e0b" strokeWidth="0.5"
      />
      <circle cx="8" cy="5" r="0.8" fill="#fef08a" className="animate-twinkle" />
      <circle cx="18" cy="8" r="0.6" fill="#fef08a" className="animate-twinkle-delay" />
      <circle cx="6" cy="15" r="0.5" fill="#fef08a" className="animate-twinkle" />
    </svg>
  )
}

function CrownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-crown-glow drop-shadow-lg">
      <defs>
        <linearGradient id="crown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M4 18h16v2H4zM4 18l1-10 4 4 3-6 3 6 4-4 1 10z"
        fill="url(#crown-grad)"
        stroke="#d97706" strokeWidth="0.5"
      />
      <circle cx="8" cy="12" r="1" fill="#fef3c7" opacity="0.9" />
      <circle cx="12" cy="10" r="1.2" fill="#fef3c7" opacity="0.9" />
      <circle cx="16" cy="12" r="1" fill="#fef3c7" opacity="0.9" />
    </svg>
  )
}

const LEVEL_ICONS: Record<number, (size?: number) => React.ReactNode> = {
  1: (s) => <SproutIcon size={s} />,
  2: (s) => <SakuraIcon size={s} />,
  3: (s) => <StarIcon size={s} />,
  4: (s) => <CrownIcon size={s} />,
}

const LEVEL_COLORS: Record<number, string> = {
  1: "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40",
  2: "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/40",
  3: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
  4: "border-yellow-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-yellow-600 dark:from-amber-950/40 dark:to-yellow-950/40",
}

export function LevelBadge({ level, totalLikes, compact }: LevelBadgeProps) {
  const info = getLevelInfo(level)
  const icon = LEVEL_ICONS[info.level] ?? LEVEL_ICONS[1]

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs" title={`Lv.${info.level} ${info.label} (추천 ${totalLikes}개)`}>
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
      <span className="text-xs text-muted-foreground">· 추천 {totalLikes}</span>
    </div>
  )
}
