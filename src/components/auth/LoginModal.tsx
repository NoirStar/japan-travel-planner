import { X, UserCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { isSupabaseConfigured } from "@/lib/supabase"

export function LoginModal() {
  const { showLoginModal, setShowLoginModal, signInWithGoogle, signInAsDemo, signInAsAdmin } = useAuthStore()

  if (!showLoginModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowLoginModal(false)}
      />

      {/* modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold gradient-text font-maple">타비톡 로그인</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            여행을 공유하고 커뮤니티에 참여하세요
          </p>
        </div>

        <div className="space-y-3">
          {isSupabaseConfigured && (
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              className="w-full gap-3 rounded-xl py-5"
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
              Google로 로그인
            </Button>
          )}

          <Button
            onClick={signInAsDemo}
            variant="outline"
            className="w-full gap-3 rounded-xl py-5 border-dashed"
          >
            <UserCircle className="h-5 w-5 text-primary" />
            데모 계정으로 체험하기
          </Button>

          <Button
            onClick={signInAsAdmin}
            variant="outline"
            className="w-full gap-3 rounded-xl py-5 border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
          >
            <Shield className="h-5 w-5" />
            관리자로 로그인
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {isSupabaseConfigured
            ? "로그인하면 서비스 이용약관에 동의합니다"
            : "데모 모드: 데이터는 브라우저에 저장됩니다"}
        </p>
      </div>
    </div>
  )
}
