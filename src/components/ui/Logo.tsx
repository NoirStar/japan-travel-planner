/** タビトーク 로고 — 종이비행기 + 사쿠라 경로 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e84393" />
          <stop offset="100%" stopColor="#d63384" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
      {/* 종이비행기 */}
      <path
        d="M12 27L28 13M28 13L23 14.5M28 13L26.5 19"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 경로 점선 */}
      <path
        d="M15 24Q18 28 22 26"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 2.5"
        opacity="0.6"
      />
      {/* 사쿠라 꽃잎 점 */}
      <circle cx="14" cy="30" r="1.8" fill="#f8b4c8" opacity="0.8" />
      <circle cx="19" cy="32" r="1.2" fill="#f8b4c8" opacity="0.5" />
    </svg>
  )
}
