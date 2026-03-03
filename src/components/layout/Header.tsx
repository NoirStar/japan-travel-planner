import { Link, useLocation } from "react-router-dom"
import { Moon, Sun, User, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/Logo"
import { useUIStore } from "@/stores/uiStore"

export function Header() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const location = useLocation()
  const isPlanner = location.pathname === "/planner"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card">
      <div className={`flex h-14 items-center justify-between px-4 ${isPlanner ? "" : "mx-auto max-w-6xl"}`}>
        <Link to="/" className="group flex items-center gap-2.5 transition-all hover:opacity-80">
          <Logo className="h-8 w-8 transition-transform group-hover:scale-105" />
          <span className="text-lg font-bold tracking-tight gradient-text">タビトーク</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/trips">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">내 여행</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="다크모드 토글"
            className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">로그인</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
