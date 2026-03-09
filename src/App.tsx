import { BrowserRouter, Routes, Route } from "react-router-dom"
import { lazy, Suspense, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { LandingPage } from "@/components/landing/LandingPage"
import { LoginModal } from "@/components/auth/LoginModal"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { useAuthStore } from "@/stores/authStore"
import { Loader2 } from "lucide-react"

/* ── Route-level code splitting ─────────────────────────── */
const PlannerPage = lazy(() => import("@/components/planner/PlannerPage").then((m) => ({ default: m.PlannerPage })))
const AIChatWizard = lazy(() => import("@/components/chat/AIChatWizard").then((m) => ({ default: m.AIChatWizard })))
const TripListPage = lazy(() => import("@/components/trips/TripListPage").then((m) => ({ default: m.TripListPage })))
const CommunityPage = lazy(() => import("@/components/community/CommunityPage").then((m) => ({ default: m.CommunityPage })))
const PostDetail = lazy(() => import("@/components/community/PostDetail").then((m) => ({ default: m.PostDetail })))
const ProfilePage = lazy(() => import("@/components/auth/ProfilePage").then((m) => ({ default: m.ProfilePage })))

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/wizard" element={<AIChatWizard />} />
            <Route path="/trips" element={<TripListPage />} />
            <Route path="/share/:shareId" element={<PlannerPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:postId" element={<PostDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
