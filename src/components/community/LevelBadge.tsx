import { getLevelInfo } from "@/types/community"

interface LevelBadgeProps {
  level: number
  totalLikes?: number
  totalPoints?: number
  isAdmin?: boolean
  compact?: boolean
}

/* ── 레벨별 애니메이션 SVG 아이콘 (Lv.1~10) ─────────── */
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
        <ellipse key={deg} cx="12" cy="6" rx="3" ry="5" fill="#f9a8d4" transform={`rotate(${deg} 12 12)`} opacity="0.85" />
      ))}
      <circle cx="12" cy="12" r="2.5" fill="#fbbf24" />
    </svg>
  )
}

function StarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-sparkle drop-shadow-md">
      <defs><linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#facc15" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs>
      <path d="M12 2l2.9 5.9L21 9.2l-4.5 4.4 1.1 6.3L12 17l-5.6 2.9 1.1-6.3L3 9.2l6.1-1.3z" fill="url(#star-grad)" stroke="#f59e0b" strokeWidth="0.5" />
      <circle cx="8" cy="5" r="0.8" fill="#fef08a" className="animate-twinkle" />
      <circle cx="18" cy="8" r="0.6" fill="#fef08a" className="animate-twinkle-delay" />
    </svg>
  )
}

function CrownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-crown-glow drop-shadow-lg">
      <defs><linearGradient id="crown-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs>
      <path d="M4 18h16v2H4zM4 18l1-10 4 4 3-6 3 6 4-4 1 10z" fill="url(#crown-grad)" stroke="#d97706" strokeWidth="0.5" />
      <circle cx="8" cy="12" r="1" fill="#fef3c7" opacity="0.9" />
      <circle cx="12" cy="10" r="1.2" fill="#fef3c7" opacity="0.9" />
      <circle cx="16" cy="12" r="1" fill="#fef3c7" opacity="0.9" />
    </svg>
  )
}

function FireIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-fire drop-shadow-md">
      <defs><linearGradient id="fire-grad" x1="50%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient></defs>
      <path d="M12 23c-4.4 0-7-3-7-6.5 0-4 3-6.5 4-9.5.7 3 2 4 3 5 0-2.5 1.5-5.5 3-8 .5 2.5 2 5 2 8 1-1 2-2 2.5-3.5C20.5 12 21 14 21 16.5 21 20 18.4 23 12 23z" fill="url(#fire-grad)" />
      <ellipse cx="12" cy="18" rx="2.5" ry="3" fill="#fef08a" opacity="0.8" />
    </svg>
  )
}

function DiamondIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-diamond-shine drop-shadow-lg">
      <defs><linearGradient id="dia-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#67e8f9" /><stop offset="50%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#f0abfc" /></linearGradient></defs>
      <path d="M6 3h12l4 7-10 12L2 10z" fill="url(#dia-grad)" stroke="#8b5cf6" strokeWidth="0.5" />
      <path d="M2 10h20M6 3l6 19M18 3l-6 19" stroke="white" strokeWidth="0.3" opacity="0.5" />
      <circle cx="10" cy="8" r="1" fill="white" opacity="0.7" className="animate-twinkle" />
    </svg>
  )
}

function DragonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-dragon-float drop-shadow-lg">
      <defs><linearGradient id="dragon-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
      <path d="M4 12c0-3 2-6 5-7 1 1 1 3 0 4 2-1 4-1 6 0-1-1-1-3 0-4 3 1 5 4 5 7 0 4-3 8-8 8s-8-4-8-8z" fill="url(#dragon-grad)" />
      <circle cx="9" cy="11" r="1.2" fill="#fef3c7" /><circle cx="9" cy="11" r="0.6" fill="#1e293b" />
      <circle cx="15" cy="11" r="1.2" fill="#fef3c7" /><circle cx="15" cy="11" r="0.6" fill="#1e293b" />
      <path d="M3 8c-1-2 0-4 1-5 0 2 1 3 2 4" fill="#10b981" opacity="0.7" />
      <path d="M21 8c1-2 0-4-1-5 0 2-1 3-2 4" fill="#10b981" opacity="0.7" />
      <path d="M10 15c0.5 0.5 1 0.7 2 0.7s1.5-0.2 2-0.7" stroke="#065f46" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function FujiIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-fuji-glow drop-shadow-lg">
      <defs><linearGradient id="fuji-grad" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#e0e7ff" /><stop offset="30%" stopColor="#93c5fd" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
      <path d="M2 20h20L12 4z" fill="url(#fuji-grad)" />
      <path d="M8 10l4-6 4 6c-1.5-1-6.5-1-8 0z" fill="white" opacity="0.9" />
      <circle cx="17" cy="7" r="1.5" fill="#fbbf24" className="animate-twinkle" opacity="0.8" />
    </svg>
  )
}

function AuroraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-aurora drop-shadow-xl">
      <defs>
        <linearGradient id="aurora-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="33%" stopColor="#a78bfa" /><stop offset="66%" stopColor="#34d399" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient>
      </defs>
      <path d="M2 18Q6 8 12 12Q18 6 22 14" stroke="url(#aurora-grad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M4 20Q8 12 12 15Q16 10 20 16" stroke="url(#aurora-grad)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <circle cx="6" cy="6" r="0.8" fill="#fef08a" className="animate-twinkle" />
      <circle cx="18" cy="4" r="0.6" fill="#fef08a" className="animate-twinkle-delay" />
      <circle cx="12" cy="3" r="0.7" fill="#fef08a" className="animate-twinkle" />
    </svg>
  )
}

function LegendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-legend drop-shadow-xl">
      <defs>
        <linearGradient id="legend-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient>
        <radialGradient id="legend-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" /><stop offset="100%" stopColor="#fbbf24" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#legend-glow)" />
      <path d="M12 2l2.9 5.9L21 9.2l-4.5 4.4 1.1 6.3L12 17l-5.6 2.9 1.1-6.3L3 9.2l6.1-1.3z" fill="url(#legend-grad)" stroke="#d97706" strokeWidth="0.5" />
      <path d="M12 6l1.5 3 3.3.7-2.4 2.3.6 3.3L12 13.5l-3 1.8.6-3.3-2.4-2.3 3.3-.7z" fill="#fef3c7" opacity="0.9" />
    </svg>
  )
}

const LEVEL_ICONS: Record<number, (size?: number) => React.ReactNode> = {
  1: (s) => <SproutIcon size={s} />,
  2: (s) => <SakuraIcon size={s} />,
  3: (s) => <StarIcon size={s} />,
  4: (s) => <CrownIcon size={s} />,
  5: (s) => <FireIcon size={s} />,
  6: (s) => <DiamondIcon size={s} />,
  7: (s) => <DragonIcon size={s} />,
  8: (s) => <FujiIcon size={s} />,
  9: (s) => <AuroraIcon size={s} />,
  10: (s) => <LegendIcon size={s} />,
}

const LEVEL_COLORS: Record<number, string> = {
  1: "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40",
  2: "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/40",
  3: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
  4: "border-yellow-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-yellow-600 dark:from-amber-950/40 dark:to-yellow-950/40",
  5: "border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/40",
  6: "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950/40",
  7: "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40",
  8: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/40",
  9: "border-indigo-400 bg-gradient-to-r from-indigo-50 to-emerald-50 dark:border-indigo-500 dark:from-indigo-950/40 dark:to-emerald-950/40",
  10: "border-amber-500 bg-gradient-to-r from-amber-50 via-red-50 to-amber-50 dark:border-amber-400 dark:from-amber-950/40 dark:via-red-950/40 dark:to-amber-950/40",
}

/* ── 관리자 전용 방패 아이콘 ───────────────────────────── */
function AdminShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-crown-glow drop-shadow-lg">
      <defs>
        <linearGradient id="admin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="url(#admin-grad)" stroke="#d97706" strokeWidth="0.5" />
      <path d="M10 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LevelBadge({ level, totalPoints, isAdmin, compact }: LevelBadgeProps) {
  // 관리자 전용 배지
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

  const info = getLevelInfo(level)
  const icon = LEVEL_ICONS[info.level] ?? LEVEL_ICONS[1]
  const pts = totalPoints ?? 0

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
