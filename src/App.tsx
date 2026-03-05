import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { LandingPage } from "@/components/landing/LandingPage"
import { PlannerPage } from "@/components/planner/PlannerPage"
import { AIChatWizard } from "@/components/chat/AIChatWizard"
import { TripListPage } from "@/components/trips/TripListPage"
import { CommunityPage } from "@/components/community/CommunityPage"
import { PostDetail } from "@/components/community/PostDetail"
import { ProfilePage } from "@/components/auth/ProfilePage"
import { LoginModal } from "@/components/auth/LoginModal"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { useAuthStore } from "@/stores/authStore"

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
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
