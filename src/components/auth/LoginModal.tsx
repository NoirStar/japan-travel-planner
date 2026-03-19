import { useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { X, MapPin, Users, Map, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { isSupabaseConfigured } from "@/lib/supabase"


export function LoginModal() {
  const navigate = useNavigate()
  const { showLoginModal, setShowLoginModal, signInWithGoogle, signInAsDemo, user, consumePendingRedirect } = useAuthStore()
  const location = useLocation()
  const wasOpenRef = useRef(false)

  // 로그인 성공 → 모달 닫고 pendingRedirect로 이동
  useEffect(() => {
    if (user && wasOpenRef.current) {
      wasOpenRef.current = false
      setShowLoginModal(false)
      const redirect = consumePendingRedirect()
      if (redirect) {
        navigate(redirect, { replace: true })
      }
    }
  }, [user, setShowLoginModal, consumePendingRedirect, navigate])

  useEffect(() => {
    if (showLoginModal) wasOpenRef.current = true
  }, [showLoginModal])

  if (!showLoginModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { setShowLoginModal(false); navigate("/") }}
      />

      {/* modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* 브랜드 헤더 */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6 text-center">
          <button
            onClick={() => { setShowLoginModal(false); navigate("/") }}
            className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="text-2xl font-bold gradient-text font-maple">타비톡</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {location.pathname.startsWith("/planner") ? "일정을 저장하려면 로그인하세요"
              : location.pathname.startsWith("/community") ? "커뮤니티에 참여하려면 로그인하세요"
              : location.pathname.startsWith("/trips") ? "내 여행을 보려면 로그인하세요"
              : "일본 여행을 계획하고 공유하세요"}
          </p>
        </div>

        {/* 기능 하이라이트 */}
        <div className="mx-6 -mt-1 mb-4 flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Map className="h-3 w-3 text-primary" />지도 플래너</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" />일정 관리</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3 text-primary" />커뮤니티</span>
        </div>

        {/* 로그인 버튼 */}
        <div className="px-6 pb-6 space-y-2.5">
          {isSupabaseConfigured && (
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              className="w-full gap-3 rounded-xl py-5 font-medium hover:bg-muted/50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 계속하기
            </Button>
          )}

          {/* 데모 로그인 — 항상 노출 */}
          <Button
            onClick={signInAsDemo}
            variant="outline"
            className="w-full gap-3 rounded-xl py-5 font-medium hover:bg-muted/50"
          >
            <UserCircle className="h-5 w-5 text-primary" />
            {isSupabaseConfigured ? "체험용 계정으로 둘러보기" : "데모 계정으로 시작하기"}
          </Button>

          <p className="mt-1 text-center text-[11px] text-muted-foreground/70">
            {isSupabaseConfigured
              ? "로그인하면 서비스 이용약관에 동의합니다"
              : "데모 계정으로 모든 기능을 체험할 수 있습니다"}
          </p>
        </div>
      </div>
    </div>
  )
}
