import { useId } from "react"

/** 타비톡 로고 — 토리이 게이트 + 루트 마커 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
      {/* 토리이 게이트 */}
      <line x1="9" y1="13" x2="31" y2="13" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="11" y1="17" x2="29" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="17" x2="14" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="17" x2="26" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* 경로 도트 */}
      <circle cx="20" cy="24" r="2" fill="white" opacity="0.9" />
      <circle cx="20" cy="30" r="1.3" fill="white" opacity="0.6" />
    </svg>
  )
}
