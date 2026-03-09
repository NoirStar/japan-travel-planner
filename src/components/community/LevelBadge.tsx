import { getLevelInfo } from "@/types/community"
import { useId } from "react"

interface LevelBadgeProps {
  level: number
  totalLikes?: number
  totalPoints?: number
  isAdmin?: boolean
  compact?: boolean
}

/* ── 레벨별 애니메이션 SVG 아이콘 (Lv.1~20) ─────────── */

/* Lv.1 새싹 — 작은 새싹 */
function SproutIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-sprout drop-shadow-sm">
      <path d="M12 22V12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12C12 8 8 6 4 6c0 4 2 6 8 6" fill="#4ade80" opacity="0.8" />
      <path d="M12 12C12 8 16 6 20 6c0 4-2 6-8 6" fill="#22c55e" opacity="0.9" />
    </svg>
  )
}

/* Lv.2 지도 — 접힌 지도 */
function MapIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-map-unfold drop-shadow-sm">
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" fill="#86efac" stroke="#16a34a" strokeWidth="0.8" />
      <path d="M9 3v15M15 6v15" stroke="#16a34a" strokeWidth="0.6" opacity="0.5" />
      <circle cx="12" cy="11" r="1.5" fill="#dc2626" opacity="0.8" />
    </svg>
  )
}

/* Lv.3 나침반 — 방향을 찾는 나침반 */
function CompassIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-compass-spin drop-shadow-sm">
      <circle cx="12" cy="12" r="9" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
      <circle cx="12" cy="12" r="7" fill="white" stroke="#0ea5e9" strokeWidth="0.5" />
      <polygon points="12,4 14,12 12,14 10,12" fill="#ef4444" />
      <polygon points="12,20 10,12 12,10 14,12" fill="#94a3b8" />
      <circle cx="12" cy="12" r="1.5" fill="#0284c7" />
    </svg>
  )
}

/* Lv.4 여권 — 여행 여권 */
function PassportIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-passport-stamp drop-shadow-sm">
      <rect x="5" y="2" width="14" height="20" rx="2" fill="#1e40af" stroke="#1e3a8a" strokeWidth="0.5" />
      <circle cx="12" cy="10" r="4" stroke="#fbbf24" strokeWidth="0.8" fill="none" />
      <circle cx="12" cy="10" r="2.5" stroke="#fbbf24" strokeWidth="0.5" fill="none" />
      <rect x="8" y="17" width="8" height="1.5" rx="0.5" fill="#fbbf24" opacity="0.8" />
    </svg>
  )
}

/* Lv.5 배낭 — 여행 배낭 */
function BackpackIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-backpack-bounce drop-shadow-sm">
      <rect x="6" y="7" width="12" height="14" rx="3" fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
      <rect x="9" y="4" width="6" height="5" rx="2" fill="#fb923c" stroke="#ea580c" strokeWidth="0.5" />
      <rect x="8" y="12" width="8" height="4" rx="1" fill="#fed7aa" opacity="0.7" />
      <path d="M10 3a2 2 0 014 0" stroke="#ea580c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/* Lv.6 기차 — 전차 */
function TrainIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-train-move drop-shadow-md">
      <defs><linearGradient id={`train-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#15803d" /></linearGradient></defs>
      <rect x="5" y="4" width="14" height="14" rx="3" fill={`url(#train-${uid})`} />
      <rect x="7" y="6" width="10" height="5" rx="1" fill="#bbf7d0" opacity="0.9" />
      <circle cx="8.5" cy="19.5" r="1.5" fill="#374151" />
      <circle cx="15.5" cy="19.5" r="1.5" fill="#374151" />
      <rect x="10" y="15" width="4" height="3" rx="0.5" fill="#fbbf24" />
    </svg>
  )
}

/* Lv.7 신칸센 — 고속열차 */
function ShinkansenIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-shinkansen-dash drop-shadow-md">
      <defs><linearGradient id={`shink-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#e0e7ff" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs>
      <path d="M3 14h14l4-3v-1c0-2-1-4-3-5H8c-2 1-4 3-4 5v4z" fill={`url(#shink-${uid})`} stroke="#6366f1" strokeWidth="0.5" />
      <rect x="6" y="8" width="4" height="3" rx="0.5" fill="#c7d2fe" />
      <rect x="12" y="8" width="4" height="3" rx="0.5" fill="#c7d2fe" />
      <path d="M3 14l1 3h14l1-3" fill="#6366f1" opacity="0.3" />
      <line x1="2" y1="17" x2="20" y2="17" stroke="#4f46e5" strokeWidth="1" />
    </svg>
  )
}

/* Lv.8 온천 — 온천 마크 */
function OnsenIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-onsen-steam drop-shadow-md">
      <ellipse cx="12" cy="17" rx="8" ry="4" fill="#93c5fd" opacity="0.6" />
      <ellipse cx="12" cy="17" rx="6" ry="3" fill="#60a5fa" opacity="0.4" />
      <path d="M8 11c0-2 1-3 0-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam-1" />
      <path d="M12 10c0-2 1-3 0-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam-2" />
      <path d="M16 11c0-2 1-3 0-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="animate-steam-3" />
    </svg>
  )
}

/* Lv.9 사쿠라 — 벚꽃 */
function SakuraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-sakura-spin drop-shadow-md">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="12" cy="6" rx="3" ry="5" fill="#f9a8d4" transform={`rotate(${deg} 12 12)`} opacity="0.85" />
      ))}
      <circle cx="12" cy="12" r="2.5" fill="#fbbf24" />
    </svg>
  )
}

/* Lv.10 도리이 — 신사 문 */
function ToriiIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-torii-glow drop-shadow-md">
      <rect x="5" y="5" width="14" height="3" rx="0.5" fill="#ef4444" />
      <rect x="4" y="4" width="16" height="2" rx="1" fill="#dc2626" />
      <rect x="7" y="7" width="2" height="14" fill="#dc2626" />
      <rect x="15" y="7" width="2" height="14" fill="#dc2626" />
      <rect x="6" y="10" width="12" height="1.5" fill="#ef4444" />
    </svg>
  )
}

/* Lv.11 성 — 일본 성 */
function CastleIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-castle-shine drop-shadow-lg">
      <defs><linearGradient id={`castle-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#fef3c7" /><stop offset="100%" stopColor="#a16207" /></linearGradient></defs>
      <path d="M4 22h16v-6H4z" fill={`url(#castle-${uid})`} />
      <path d="M6 16h12v-4H6z" fill="#fbbf24" />
      <path d="M8 12h8v-3H8z" fill="#f59e0b" />
      <path d="M10 9h4l-2-4z" fill="#d97706" />
      <rect x="11" y="18" width="2" height="4" fill="#92400e" />
      <rect x="7" y="13" width="1.5" height="2" rx="0.5" fill="#fef3c7" opacity="0.8" />
      <rect x="15.5" y="13" width="1.5" height="2" rx="0.5" fill="#fef3c7" opacity="0.8" />
    </svg>
  )
}

/* Lv.12 마츠리 — 제등/축제 */
function MatsuriIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-lantern-swing drop-shadow-lg">
      <defs><radialGradient id={`lantern-${uid}`} cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#fef08a" /><stop offset="100%" stopColor="#ef4444" /></radialGradient></defs>
      <line x1="12" y1="2" x2="12" y2="5" stroke="#92400e" strokeWidth="1" />
      <ellipse cx="12" cy="12" rx="5" ry="7" fill={`url(#lantern-${uid})`} stroke="#dc2626" strokeWidth="0.5" />
      <line x1="7" y1="10" x2="17" y2="10" stroke="#dc2626" strokeWidth="0.5" opacity="0.6" />
      <line x1="7" y1="14" x2="17" y2="14" stroke="#dc2626" strokeWidth="0.5" opacity="0.6" />
      <rect x="10" y="5" width="4" height="1.5" rx="0.5" fill="#92400e" />
      <rect x="10" y="18.5" width="4" height="1.5" rx="0.5" fill="#92400e" />
    </svg>
  )
}

/* Lv.13 사무라이 — 칼 */
function SamuraiIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-samurai-slash drop-shadow-lg">
      <defs><linearGradient id={`blade-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e2e8f0" /><stop offset="50%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#cbd5e1" /></linearGradient></defs>
      <path d="M6 20L18 4" stroke={`url(#blade-${uid})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 20L18 4" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      <rect x="4" y="18" width="6" height="2" rx="1" fill="#92400e" transform="rotate(-45 7 19)" />
      <line x1="7.5" y1="16" x2="10.5" y2="19" stroke="#fbbf24" strokeWidth="1.5" />
    </svg>
  )
}

/* Lv.14 닌자 — 수리검 */
function NinjaIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-ninja-spin drop-shadow-lg">
      <defs><linearGradient id={`ninja-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#475569" /><stop offset="100%" stopColor="#1e293b" /></linearGradient></defs>
      <path d="M12 2l3 7h-6zM22 12l-7 3v-6zM12 22l-3-7h6zM2 12l7-3v6z" fill={`url(#ninja-${uid})`} />
      <circle cx="12" cy="12" r="2.5" fill="#334155" stroke="#94a3b8" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="1" fill="#e2e8f0" />
    </svg>
  )
}

/* Lv.15 용 — 드래곤 */
function DragonIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-dragon-float drop-shadow-lg">
      <defs><linearGradient id={`dragon-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
      <path d="M4 12c0-3 2-6 5-7 1 1 1 3 0 4 2-1 4-1 6 0-1-1-1-3 0-4 3 1 5 4 5 7 0 4-3 8-8 8s-8-4-8-8z" fill={`url(#dragon-${uid})`} />
      <circle cx="9" cy="11" r="1.2" fill="#fef3c7" /><circle cx="9" cy="11" r="0.6" fill="#1e293b" />
      <circle cx="15" cy="11" r="1.2" fill="#fef3c7" /><circle cx="15" cy="11" r="0.6" fill="#1e293b" />
      <path d="M3 8c-1-2 0-4 1-5 0 2 1 3 2 4" fill="#10b981" opacity="0.7" />
      <path d="M21 8c1-2 0-4-1-5 0 2-1 3-2 4" fill="#10b981" opacity="0.7" />
      <path d="M10 15c.5.5 1 .7 2 .7s1.5-.2 2-.7" stroke="#065f46" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* Lv.16 후지산 — 후지산 */
function FujiIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-fuji-glow drop-shadow-lg">
      <defs><linearGradient id={`fuji-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#e0e7ff" /><stop offset="30%" stopColor="#93c5fd" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
      <path d="M2 20h20L12 4z" fill={`url(#fuji-${uid})`} />
      <path d="M8 10l4-6 4 6c-1.5-1-6.5-1-8 0z" fill="white" opacity="0.9" />
      <circle cx="17" cy="7" r="1.5" fill="#fbbf24" className="animate-twinkle" opacity="0.8" />
    </svg>
  )
}

/* Lv.17 오로라 — 오로라 */
function AuroraIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-aurora drop-shadow-xl">
      <defs>
        <linearGradient id={`aurora-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="33%" stopColor="#a78bfa" /><stop offset="66%" stopColor="#34d399" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient>
      </defs>
      <path d="M2 18Q6 8 12 12Q18 6 22 14" stroke={`url(#aurora-${uid})`} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M4 20Q8 12 12 15Q16 10 20 16" stroke={`url(#aurora-${uid})`} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <circle cx="6" cy="6" r="0.8" fill="#fef08a" className="animate-twinkle" />
      <circle cx="18" cy="4" r="0.6" fill="#fef08a" className="animate-twinkle-delay" />
      <circle cx="12" cy="3" r="0.7" fill="#fef08a" className="animate-twinkle" />
    </svg>
  )
}

/* Lv.18 왕관 — 황금 왕관 */
function CrownIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-crown-glow drop-shadow-xl">
      <defs><linearGradient id={`crown-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs>
      <path d="M4 18h16v2H4zM4 18l1-10 4 4 3-6 3 6 4-4 1 10z" fill={`url(#crown-${uid})`} stroke="#d97706" strokeWidth="0.5" />
      <circle cx="8" cy="12" r="1" fill="#fef3c7" opacity="0.9" />
      <circle cx="12" cy="10" r="1.2" fill="#fef3c7" opacity="0.9" />
      <circle cx="16" cy="12" r="1" fill="#fef3c7" opacity="0.9" />
    </svg>
  )
}

/* Lv.19 다이아 — 다이아몬드 */
function DiamondIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-diamond-shine drop-shadow-xl">
      <defs><linearGradient id={`dia-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#67e8f9" /><stop offset="50%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#f0abfc" /></linearGradient></defs>
      <path d="M6 3h12l4 7-10 12L2 10z" fill={`url(#dia-${uid})`} stroke="#8b5cf6" strokeWidth="0.5" />
      <path d="M2 10h20M6 3l6 19M18 3l-6 19" stroke="white" strokeWidth="0.3" opacity="0.5" />
      <circle cx="10" cy="8" r="1" fill="white" opacity="0.7" className="animate-twinkle" />
    </svg>
  )
}

/* Lv.20 전설 — 전설의 별 */
function LegendIcon({ size = 20 }: { size?: number }) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-legend drop-shadow-xl">
      <defs>
        <linearGradient id={`legend-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient>
        <radialGradient id={`legend-glow-${uid}`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" /><stop offset="100%" stopColor="#fbbf24" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#legend-glow-${uid})`} />
      <path d="M12 2l2.9 5.9L21 9.2l-4.5 4.4 1.1 6.3L12 17l-5.6 2.9 1.1-6.3L3 9.2l6.1-1.3z" fill={`url(#legend-${uid})`} stroke="#d97706" strokeWidth="0.5" />
      <path d="M12 6l1.5 3 3.3.7-2.4 2.3.6 3.3L12 13.5l-3 1.8.6-3.3-2.4-2.3 3.3-.7z" fill="#fef3c7" opacity="0.9" />
    </svg>
  )
}

const LEVEL_ICONS: Record<number, (size?: number) => React.ReactNode> = {
  1:  (s) => <SproutIcon size={s} />,
  2:  (s) => <MapIcon size={s} />,
  3:  (s) => <CompassIcon size={s} />,
  4:  (s) => <PassportIcon size={s} />,
  5:  (s) => <BackpackIcon size={s} />,
  6:  (s) => <TrainIcon size={s} />,
  7:  (s) => <ShinkansenIcon size={s} />,
  8:  (s) => <OnsenIcon size={s} />,
  9:  (s) => <SakuraIcon size={s} />,
  10: (s) => <ToriiIcon size={s} />,
  11: (s) => <CastleIcon size={s} />,
  12: (s) => <MatsuriIcon size={s} />,
  13: (s) => <SamuraiIcon size={s} />,
  14: (s) => <NinjaIcon size={s} />,
  15: (s) => <DragonIcon size={s} />,
  16: (s) => <FujiIcon size={s} />,
  17: (s) => <AuroraIcon size={s} />,
  18: (s) => <CrownIcon size={s} />,
  19: (s) => <DiamondIcon size={s} />,
  20: (s) => <LegendIcon size={s} />,
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
