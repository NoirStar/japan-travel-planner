import { Link } from "react-router-dom"
import { ChevronLeft, Briefcase } from "lucide-react"

interface PlannerTopBarProps {
  tripTitle?: string
}

export function PlannerTopBar({ tripTitle }: PlannerTopBarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center bg-background/95 backdrop-blur-sm border-b border-border px-3 z-30">
      {/* Left: Logo → Home (desktop) / Back button (mobile) */}
      <Link
        to="/"
        className="flex items-center gap-1.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="홈으로"
      >
        {/* Mobile: back arrow */}
        <ChevronLeft className="h-4 w-4 lg:hidden" />
        {/* Desktop: logo */}
        <img
          src="/logo/logo.png"
          alt="타비톡"
          className="hidden lg:block h-6 w-6 rounded-md"
        />
        <span className="text-xs font-medium lg:font-bold lg:text-sm">
          <span className="lg:hidden">홈</span>
          <span className="hidden lg:inline text-foreground">타비톡</span>
        </span>
      </Link>

      {/* Center: Trip title */}
      <div className="flex-1 min-w-0 mx-3">
        <p className="text-xs font-medium text-muted-foreground truncate text-center">
          {tripTitle || "여행 계획"}
        </p>
      </div>

      {/* Right: Quick nav */}
      <Link
        to="/trips"
        className="flex items-center gap-1 shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="내 여행"
      >
        <Briefcase className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">내 여행</span>
      </Link>
    </header>
  )
}
