import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { Bell, User, LogOut, Settings, MessageSquareText } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useNotifications } from "@/hooks/useNotifications"
import { isSupabaseConfigured } from "@/lib/supabase"
import { LevelBadge } from "@/components/community/LevelBadge"
import { Logo } from "@/components/ui/Logo"

interface NavItem {
  label: string
  path: string
  match: (pathname: string) => boolean
  authRequired?: boolean
}

const navItems: NavItem[] = [
  { label: "플래너", path: "/planner", match: (p) => p === "/planner" || p.startsWith("/share/") },
  { label: "여행공유", path: "/community", match: (p) => p === "/community" || (p.startsWith("/community/") && !p.startsWith("/community/free")) },
  { label: "자유게시판", path: "/community/free", match: (p) => p.startsWith("/community/free") },
  { label: "내 여행", path: "/trips", match: (p) => p === "/trips", authRequired: true },
]

export function TopHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, setShowLoginModal, signOut, isDemoMode, isLoading: isAuthLoading } = useAuthStore()

  const [profileOpen, setProfileOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<SVGSVGElement | null>(null)

  const useMockNotifications = !isSupabaseConfigured || isDemoMode
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id ?? null, useMockNotifications)
  const prevUnreadRef = useRef(unreadCount)

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      const bell = bellRef.current
      if (bell) {
        bell.classList.remove("animate-bell")
        void bell.getBoundingClientRect()
        bell.classList.add("animate-bell")
        const timer = window.setTimeout(() => bell.classList.remove("animate-bell"), 1000)
        prevUnreadRef.current = unreadCount
        return () => window.clearTimeout(timer)
      }
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) setNotiOpen(false)
    }
    if (profileOpen || notiOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileOpen, notiOpen])

  const isLoggedIn = !!user && !!profile

  return (
    <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-14 items-center border-b border-border/30 bg-card/90 backdrop-blur-xl px-6">
      {/* Left: Logo + Brand */}
      <Link to="/" className="flex items-center gap-2.5 mr-8 shrink-0" aria-label="타비톡 홈">
        <Logo className="h-8 w-8" />
        <span className="gradient-text font-maple text-lg">타비톡</span>
      </Link>

      {/* Center: Nav Links */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          if (item.authRequired && !isLoggedIn) return null
          const active = item.match(location.pathname)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-2">
        {isAuthLoading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        ) : isLoggedIn ? (
          <>
            {/* Notifications */}
            <div className="relative" ref={notiRef}>
              <button
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  notiOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => {
                  setNotiOpen((v) => !v)
                  setProfileOpen(false)
                  if (!notiOpen) void markAllRead()
                }}
                aria-label="알림"
              >
                <Bell ref={bellRef} className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notiOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl z-50">
                  <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">알림</div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-muted-foreground">알림이 없습니다</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                          onClick={() => {
                            setNotiOpen(false)
                            navigate(`/community/${n.post_id}`)
                          }}
                        >
                          <span className="text-xs">
                            <span className="font-medium">{n.actor_nickname}</span>
                            {n.type === "comment" ? "님이 댓글을 남겼습니다" : "님이 추천했습니다"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">{n.post_title}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  profileOpen ? "ring-2 ring-primary/30" : "hover:ring-2 hover:ring-border"
                }`}
                onClick={() => {
                  setProfileOpen((v) => !v)
                  setNotiOpen(false)
                }}
                aria-label="프로필"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {profile.nickname.charAt(0)}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl z-50">
                  <div className="border-b border-border px-4 py-2.5">
                    <p className="text-sm font-medium truncate">{profile.nickname}</p>
                    <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />
                  </div>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setProfileOpen(false); navigate("/profile") }}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    프로필 설정
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setProfileOpen(false); navigate("/contact") }}
                  >
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    문의하기
                  </button>
                  <div className="border-t border-border" />
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                    onClick={async () => { setProfileOpen(false); await signOut(); navigate("/") }}
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            className="flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setShowLoginModal(true)}
          >
            <User className="h-[18px] w-[18px]" />
            로그인
          </button>
        )}
      </div>
    </header>
  )
}
