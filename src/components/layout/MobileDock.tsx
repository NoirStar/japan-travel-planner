import { Link, useLocation } from "react-router-dom"
import { Home, Compass, Globe, Briefcase, User } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface DockItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  match: (pathname: string) => boolean
  authRequired?: boolean
}

const dockItems: DockItem[] = [
  { icon: Home, label: "홈", path: "/", match: (p) => p === "/" },
  { icon: Compass, label: "플래너", path: "/planner", match: (p) => p === "/planner" || p.startsWith("/share/") },
  { icon: Globe, label: "커뮤니티", path: "/community", match: (p) => p.startsWith("/community") },
  { icon: Briefcase, label: "내 여행", path: "/trips", match: (p) => p === "/trips", authRequired: true },
]

export function MobileDock() {
  const location = useLocation()
  const { user, profile, setShowLoginModal } = useAuthStore()
  const isLoggedIn = !!user && !!profile

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-card/90 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex h-14 items-stretch justify-around">
        {dockItems.map((item) => {
          if (item.authRequired && !isLoggedIn) return null
          const active = item.match(location.pathname)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Profile / Login */}
        {isLoggedIn ? (
          <Link
            to="/profile"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
              location.pathname === "/profile" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                  {profile.nickname.charAt(0)}
                </div>
              )}
              {location.pathname === "/profile" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] font-medium">프로필</span>
          </Link>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">로그인</span>
          </button>
        )}
      </div>
    </nav>
  )
}
