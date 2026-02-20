import { Link, useLocation } from "react-router-dom"
import { Moon, Sun, User, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"

export function Header() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const location = useLocation()
  const isPlanner = location.pathname === "/planner"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className={`flex h-14 items-center justify-between px-4 ${isPlanner ? "" : "mx-auto max-w-6xl"}`}>
        <Link to="/" className="group flex items-center gap-2.5 transition-all hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sakura-dark to-indigo text-white shadow-md transition-transform group-hover:scale-105">
            <Plane className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">タビトーク</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="다크모드 토글"
            className="rounded-full hover:bg-sakura/20"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-full hover:bg-sakura/20">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">로그인</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
