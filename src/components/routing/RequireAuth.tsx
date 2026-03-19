import { useEffect, useRef, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface RequireAuthProps {
  children: ReactNode
  redirectTo: string
}

export function RequireAuth({ children, redirectTo: _redirectTo }: RequireAuthProps) {
  const location = useLocation()
  const { user, isLoading, setShowLoginModal, setPendingRedirect } = useAuthStore()
  const promptedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !user && !promptedRef.current) {
      promptedRef.current = true
      // 로그인 후 복귀할 경로 저장
      setPendingRedirect(location.pathname + location.search)
      setShowLoginModal(true)
    }
  }, [isLoading, setShowLoginModal, setPendingRedirect, user, location.pathname, location.search])

  // 로그인 성공 시 promptedRef 리셋
  useEffect(() => {
    if (user) {
      promptedRef.current = false
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    // 모달을 띄운 상태로 빈 화면 표시 (리다이렉트하지 않음)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 text-primary/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">로그인이 필요한 페이지입니다</p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          로그인
        </button>
      </div>
    )
  }

  return <>{children}</>
}
