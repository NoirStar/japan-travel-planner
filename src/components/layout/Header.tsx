import { Link, useLocation } from "react-router-dom"
import { MapPin, Moon, Sun, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"

export function Header() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const location = useLocation()
  const isPlanner = location.pathname === "/planner"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className={`flex h-16 items-center justify-between px-4 ${isPlanner ? "" : "mx-auto max-w-6xl"}`}>
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">타비톡</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">TabiTalk</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="다크모드 토글"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">로그인</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
