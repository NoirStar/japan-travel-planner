import { Link, useLocation } from "react-router-dom"
import { Moon, Sun, User, List, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { LevelBadge } from "@/components/community/LevelBadge"

export function Header() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const { user, profile, setShowLoginModal } = useAuthStore()
  const location = useLocation()
  const isPlanner = location.pathname === "/planner"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card">
      <div className={`flex h-14 items-center justify-between px-4 ${isPlanner ? "" : "mx-auto max-w-6xl"}`}>
        <Link to="/" className="group flex items-center gap-2 transition-all hover:opacity-80">
          <span className="text-lg font-bold tracking-tight gradient-text">타비톡</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/trips">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">내 여행</span>
            </Button>
          </Link>
          <Link to="/community">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">커뮤니티</span>
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

          {user && profile ? (
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {profile.nickname.charAt(0)}
                  </div>
                )}
                <span className="hidden sm:inline text-sm">{profile.nickname}</span>
                <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => setShowLoginModal(true)}
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">로그인</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
