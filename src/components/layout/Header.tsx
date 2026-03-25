import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Moon, Sun, User, Users, LogOut, Settings, ChevronDown, MapPin, PenSquare, Compass, Bell, MessageSquareText, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { useNotifications } from "@/hooks/useNotifications"
import { isSupabaseConfigured } from "@/lib/supabase"
import { LevelBadge } from "@/components/community/LevelBadge"
import { Logo } from "@/components/ui/Logo"

export function Header() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const { user, profile, setShowLoginModal, signOut, isDemoMode, isLoading: isAuthLoading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const isPlanner = location.pathname === "/planner"
  const isCommunity = location.pathname.startsWith("/community")
  const isTrips = location.pathname === "/trips"
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const communityRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)

  const bellRef = useRef<SVGSVGElement | null>(null)
  const useMockNotifications = !isSupabaseConfigured || isDemoMode
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id ?? null, useMockNotifications)
  const prevUnreadRef = useRef(unreadCount)

  // 새 알림이 오면 벨 흔들림
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      const bell = bellRef.current
      if (bell) {
        bell.classList.remove("animate-bell")
        void bell.getBoundingClientRect()
        bell.classList.add("animate-bell")

        const timer = window.setTimeout(() => {
          bell.classList.remove("animate-bell")
        }, 1000)

        prevUnreadRef.current = unreadCount
        return () => window.clearTimeout(timer)
      }
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setCommunityOpen(false)
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false)
      }
    }
    if (dropdownOpen || communityOpen || notiOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen, communityOpen, notiOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl backdrop-saturate-200">
      <div className={`flex h-14 items-center justify-between px-5 ${isPlanner ? "" : "mx-auto max-w-6xl"}`}>
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="타비톡 홈" className="group flex shrink-0 items-center transition-all hover:opacity-80">
            <Logo className="h-7 w-7" />
            <span className="text-xl font-extrabold tracking-tight whitespace-nowrap gradient-text font-maple">타비톡</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link to="/planner">
            <Button variant="ghost" size="sm" className={`gap-1.5 rounded-xl px-3 py-2 h-11 hover:bg-muted ${
              isPlanner ? "text-cyan bg-cyan/10 font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}>
              <Compass className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline text-[13px]">플래너</span>
            </Button>
          </Link>

          {/* 커뮤니티 드롭다운 */}
          <div className="relative" ref={communityRef}>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-xl px-3 py-2 h-11 hover:bg-muted ${
                isCommunity ? "text-cyan bg-cyan/10 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setCommunityOpen((v) => !v); setDropdownOpen(false) }}
            >
              <Users className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline text-[13px]">커뮤니티</span>
              <ChevronDown className={`hidden sm:block h-3 w-3 transition-transform ${communityOpen ? "rotate-180" : ""}`} />
            </Button>

            {communityOpen && (
              <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-xl z-50">
                <Link
                  to="/community"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setCommunityOpen(false)}
                >
                  <MapPin className="h-4 w-4 text-primary/60" />
                  공유 일정
                </Link>
                <div className="mx-3 h-px bg-border" />
                <Link
                  to="/community/free"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setCommunityOpen(false)}
                >
                  <PenSquare className="h-4 w-4 text-indigo/60" />
                  자유게시판
                </Link>
              </div>
            )}
          </div>

          {isAuthLoading ? (
            /* ── 인증 로딩 중: 로그인 레이아웃과 동일 폭 스켈레톤 ── */
            <>
              <div className="h-11 w-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            </>
          ) : user && profile ? (
            <>
            {/* ── 내 여행 (로그인 시) ── */}
            <Link to="/trips">
              <Button variant="ghost" size="sm" className={`gap-1.5 rounded-xl px-3 py-2 h-11 hover:bg-muted ${
                isTrips ? "text-cyan bg-cyan/10 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}>
                <Briefcase className="h-[18px] w-[18px]" />
                <span className="hidden sm:inline text-[13px]">내 여행</span>
              </Button>
            </Link>

            {/* ── 로그인 상태: 프로필 드롭다운 ──────── */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-primary/10" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {profile.nickname.charAt(0)}
                  </div>
                )}
                <span className="hidden sm:inline text-[13px] font-medium">{profile.nickname}</span>
                <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />
                <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </Button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    프로필 설정
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate("/contact"); }}
                  >
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    문의하기
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { toggleDarkMode(); }}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                    {isDarkMode ? "라이트 모드" : "다크 모드"}
                  </button>
                  <div className="border-t border-border" />
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                    onClick={async () => { setDropdownOpen(false); await signOut(); navigate("/"); }}
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>

            {/* ── 알림 벨 아이콘 ───────────────────── */}
            <div className="relative" ref={notiRef}>
              <Button
                variant="ghost"
                size="sm"
                className="relative rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-2"
                onClick={() => {
                  setNotiOpen((v) => !v)
                  setDropdownOpen(false)
                  setCommunityOpen(false)
                  if (!notiOpen) {
                    void markAllRead()
                  }
                }}
              >
                <Bell ref={bellRef} className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {notiOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg z-50">
                  <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">알림</div>
                  <div className="max-h-64 overflow-y-auto">
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
            </>
          ) : (
            /* ── 비로그인 상태: 다크모드 + 로그인 CTA ──── */
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-2"
                onClick={() => { toggleDarkMode(); }}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl text-[13px] font-semibold px-5 h-11"
                onClick={() => { setShowLoginModal(true); }}
              >
                <User className="h-4 w-4" />
                <span className="text-[13px]">로그인</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
