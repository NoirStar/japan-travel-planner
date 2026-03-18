import { BrowserRouter, Routes, Route } from "react-router-dom"
import { lazy, Suspense, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { LandingPage } from "@/components/landing/LandingPage"
import { LoginModal } from "@/components/auth/LoginModal"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { CelebrationProvider } from "@/components/ui/CelebrationOverlay"
import { RequireAuth } from "@/components/routing/RequireAuth"
import { useAuthStore } from "@/stores/authStore"
import { Loader2 } from "lucide-react"

/* ── Route-level code splitting ─────────────────────────── */
// 배포 후 stale chunk 에러 방지: import 실패 시 페이지 새로고침
function lazyRetry<T extends Record<string, unknown>>(factory: () => Promise<T>): Promise<T> {
  return factory().catch(() => {
    // chunk가 없으면 새 배포 후 캐시 불일치 → 한 번만 새로고침
    const key = "chunk-retry"
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1")
      window.location.reload()
    }
    return factory()
  })
}

const PlannerPage = lazy(() => lazyRetry(() => import("@/components/planner/PlannerPage")).then((m) => ({ default: m.PlannerPage })))
const AIChatWizard = lazy(() => lazyRetry(() => import("@/components/chat/AIChatWizard")).then((m) => ({ default: m.AIChatWizard })))
const TripListPage = lazy(() => lazyRetry(() => import("@/components/trips/TripListPage")).then((m) => ({ default: m.TripListPage })))
const CommunityPage = lazy(() => lazyRetry(() => import("@/components/community/CommunityPage")).then((m) => ({ default: m.CommunityPage })))
const FreeBoardPage = lazy(() => lazyRetry(() => import("@/components/community/FreeBoardPage")).then((m) => ({ default: m.FreeBoardPage })))
const CreateFreePostPage = lazy(() => lazyRetry(() => import("@/components/community/CreateFreePostPage")).then((m) => ({ default: m.CreateFreePostPage })))
const EditFreePostPage = lazy(() => lazyRetry(() => import("@/components/community/EditFreePostPage")).then((m) => ({ default: m.EditFreePostPage })))
const PostDetail = lazy(() => lazyRetry(() => import("@/components/community/PostDetail")).then((m) => ({ default: m.PostDetail })))
const ProfilePage = lazy(() => lazyRetry(() => import("@/components/auth/ProfilePage")).then((m) => ({ default: m.ProfilePage })))
const ContactPage = lazy(() => lazyRetry(() => import("@/components/contact/ContactPage")).then((m) => ({ default: m.ContactPage })))
const JoinTripPage = lazy(() => lazyRetry(() => import("@/components/planner/JoinTripPage")).then((m) => ({ default: m.JoinTripPage })))
const ShareRedirectPage = lazy(() => lazyRetry(() => import("@/components/planner/ShareRedirectPage")).then((m) => ({ default: m.ShareRedirectPage })))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Header />
        <LoginModal />
        <CelebrationProvider />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/wizard" element={<AIChatWizard />} />
            <Route path="/trips" element={<RequireAuth redirectTo="/"><TripListPage /></RequireAuth>} />
            <Route path="/share/:shareId" element={<PlannerPage />} />
            <Route path="/s/:shareCode" element={<ShareRedirectPage />} />
            <Route path="/collab/:inviteCode" element={<JoinTripPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/free" element={<FreeBoardPage />} />
            <Route path="/community/free/write" element={<RequireAuth redirectTo="/community/free"><CreateFreePostPage /></RequireAuth>} />
            <Route path="/community/free/edit/:postId" element={<RequireAuth redirectTo="/community/free"><EditFreePostPage /></RequireAuth>} />
            <Route path="/community/:postId" element={<PostDetail />} />
            <Route path="/profile" element={<RequireAuth redirectTo="/"><ProfilePage /></RequireAuth>} />
            <Route path="/contact" element={<RequireAuth redirectTo="/"><ContactPage /></RequireAuth>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
