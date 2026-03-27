/** 타비톡 로고 — 실제 로고 이미지 사용 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src="/logo/logo.png"
      alt="타비톡"
      className={`${className} rounded-lg`}
      aria-hidden="true"
    />
  )
}
