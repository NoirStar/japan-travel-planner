import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Moon, Sun, User, Users, LogOut, Settings, ChevronDown, MapPin, PenSquare, Compass, List, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { LevelBadge } from "@/components/community/LevelBadge"
import { getMockNotifications, getUnreadNotificationCount, markNotificationsRead } from "@/lib/mockCommunity"

export function Header() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const { user, profile, setShowLoginModal, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const isPlanner = location.pathname === "/planner"
  const isCommunity = location.pathname.startsWith("/community")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const communityRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)

  const unreadCount = user ? getUnreadNotificationCount(user.id) : 0

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card">
      <div className={`flex h-14 items-center justify-between px-4 ${isPlanner ? "" : "mx-auto max-w-6xl"}`}>
        <Link to="/" className="group flex items-center gap-2 transition-all hover:opacity-80">
          <span className="text-lg font-bold tracking-tight gradient-text font-maple">타비톡</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/planner">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">여행 만들기</span>
            </Button>
          </Link>

          {/* 커뮤니티 드롭다운 */}
          <div className="relative" ref={communityRef}>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-lg hover:bg-muted ${
                isCommunity ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setCommunityOpen((v) => !v); setDropdownOpen(false) }}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">커뮤니티</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${communityOpen ? "rotate-180" : ""}`} />
            </Button>

            {communityOpen && (
              <div className="absolute left-0 top-full mt-1 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg z-50">
                <Link
                  to="/community"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => setCommunityOpen(false)}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  여행 공유
                </Link>
                <Link
                  to="/community/free"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => setCommunityOpen(false)}
                >
                  <PenSquare className="h-4 w-4 text-muted-foreground" />
                  자유게시판
                </Link>
              </div>
            )}
          </div>

          {user && profile ? (
            /* ── 알림 벨 아이콘 ───────────────────── */
            <>
            <div className="relative" ref={notiRef}>
              <Button
                variant="ghost"
                size="sm"
                className="relative rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-2"
                onClick={() => {
                  setNotiOpen((v) => !v)
                  setDropdownOpen(false)
                  setCommunityOpen(false)
                  if (!notiOpen && user) markNotificationsRead(user.id)
                }}
              >
                <Bell className="h-4 w-4" />
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
                    {(() => {
                      const notifications = getMockNotifications(user.id).slice(0, 20)
                      if (notifications.length === 0) {
                        return <p className="px-4 py-6 text-center text-xs text-muted-foreground">알림이 없습니다</p>
                      }
                      return notifications.map((n) => (
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
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* ── 로그인 상태: 프로필 드롭다운 ──────── */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {profile.nickname.charAt(0)}
                  </div>
                )}
                <span className="hidden sm:inline text-sm">{profile.nickname}</span>
                <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} compact />
                <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </Button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    프로필 설정
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setDropdownOpen(false); navigate("/trips"); }}
                  >
                    <List className="h-4 w-4 text-muted-foreground" />
                    내 여행
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
            </>
          ) : (
            /* ── 비로그인 상태: 로그인 드롭다운 ──── */
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">메뉴</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </Button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { toggleDarkMode(); }}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                    {isDarkMode ? "라이트 모드" : "다크 모드"}
                  </button>
                  <div className="border-t border-border" />
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => { setDropdownOpen(false); setShowLoginModal(true); }}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    로그인
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
