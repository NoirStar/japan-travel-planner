import { useState, useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Home,
  Compass,
  Globe,
  MessageSquareText,
  MoreHorizontal,
  Briefcase,
  User,
  Bell,
  LogOut,
  X,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface TabItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path?: string
  match: (pathname: string) => boolean
  action?: "more"
}

const tabs: TabItem[] = [
  { icon: Home, label: "홈", path: "/", match: (p) => p === "/" },
  {
    icon: Compass,
    label: "플래너",
    path: "/planner",
    match: (p) => p === "/planner" || p.startsWith("/share/"),
  },
  {
    icon: Globe,
    label: "여행공유",
    path: "/community",
    match: (p) =>
      p === "/community" ||
      (p.startsWith("/community/") && !p.startsWith("/community/free")),
  },
  {
    icon: MessageSquareText,
    label: "자유게시판",
    path: "/community/free",
    match: (p) => p.startsWith("/community/free"),
  },
  {
    icon: MoreHorizontal,
    label: "더보기",
    action: "more",
    match: () => false,
  },
]

function MoreSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { user, profile, setShowLoginModal, signOut } = useAuthStore()
  const isLoggedIn = !!user && !!profile

  const handleNav = useCallback(
    (path: string) => {
      onClose()
      navigate(path)
    },
    [navigate, onClose],
  )

  const handleLogin = useCallback(() => {
    onClose()
    setShowLoginModal(true)
  }, [onClose, setShowLoginModal])

  const handleLogout = useCallback(async () => {
    onClose()
    await signOut()
  }, [onClose, signOut])

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [open])

  const menuItems = [
    { icon: Briefcase, label: "내 여행", onClick: () => handleNav("/trips") },
    { icon: User, label: "프로필", onClick: () => handleNav("/profile") },
    { icon: Bell, label: "알림", onClick: () => handleNav("/notifications") },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[61] rounded-t-2xl bg-background border-t border-border transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Handle + Close */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30 mx-auto" />
          <button
            onClick={onClose}
            className="absolute right-4 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu items */}
        <div className="px-4 py-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.label}
            </button>
          ))}

          <div className="my-2 border-t border-border" />

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-5 w-5" />
              로그아웃
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-primary hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5" />
              로그인
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export function MobileDock() {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-14 items-stretch justify-around">
          {tabs.map((tab) => {
            const active = tab.match(location.pathname)
            const isMore = tab.action === "more"

            const content = (
              <>
                {active && (
                  <div className="absolute top-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
                <tab.icon
                  className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {tab.label}
                </span>
              </>
            )

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors text-muted-foreground"
                >
                  {content}
                </button>
              )
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path!)}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
              >
                {content}
              </button>
            )
          })}
        </div>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
