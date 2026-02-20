import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { LandingPage } from "@/components/landing/LandingPage"
import { PlannerPage } from "@/components/planner/PlannerPage"
import { AIChatWizard } from "@/components/chat/AIChatWizard"
import { TripListPage } from "@/components/trips/TripListPage"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/wizard" element={<AIChatWizard />} />
          <Route path="/trips" element={<TripListPage />} />
          <Route path="/share/:shareId" element={<PlannerPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
